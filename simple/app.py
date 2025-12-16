from flask import Flask, render_template, request, redirect, url_for, session, flash
from datetime import datetime, timedelta
from typing import Optional
import os
import json

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# 数据文件路径
DATA_FILE = 'library_data.json'

# 导入原有的类
class Publication:
    def __init__(self, title: str) -> None:
        self.title = title
        self._is_borrowed = False
        self._borrower = None
        self._due_date = None

    @property
    def is_borrowed(self) -> bool:
        return self._is_borrowed

    @property
    def borrower(self):
        return self._borrower

    @property
    def due_date(self):
        return self._due_date

    def get_max_loan_days(self) -> int:
        raise NotImplementedError("子类必须实现此方法")

    def receive_borrow_message(self, reader, days: int = None, **kwargs) -> tuple[bool, str]:
        if self._is_borrowed:
            due_date_str = self._due_date.strftime('%Y-%m-%d') if self._due_date else '未知'
            return False, f"书已被{self._borrower.name}借出，预计{due_date_str}归还"
        
        if days is None:
            days = self.get_max_loan_days()
        
        if days <= 0:
            return False, "借阅天数必须大于0"
        
        self._is_borrowed = True
        self._borrower = reader
        self._due_date = datetime.now() + timedelta(days=days)
        
        return True, f"借阅成功，请于{self._due_date.strftime('%Y-%m-%d')}前归还"

    def receive_return_message(self) -> bool:
        if self._is_borrowed:
            self._is_borrowed = False
            self._borrower = None
            self._due_date = None
            return True
        return False

    def get_description(self) -> str:
        raise NotImplementedError("子类必须实现此方法")

class Book(Publication):
    def __init__(self, title: str, author: str, isbn: str, category: str = "技术") -> None:
        super().__init__(title)
        self.author = author
        self.isbn = isbn
        self.category = category

    def get_max_loan_days(self) -> int:
        return 14

    def get_description(self) -> str:
        return f"《{self.title}》- 作者: {self.author}, 分类: {self.category}"

class Magazine(Publication):
    def __init__(self, title: str, issue: str, publisher: str) -> None:
        super().__init__(title)
        self.issue = issue
        self.publisher = publisher
        self._is_latest = False

    def mark_as_latest(self) -> None:
        self._is_latest = True

    def mark_as_archive(self) -> None:
        self._is_latest = False

    def get_max_loan_days(self) -> int:
        return 7 if self._is_latest else 14

    def get_description(self) -> str:
        status = "最新期刊" if self._is_latest else "过刊"
        return f"《{self.title}》- 期号: {self.issue}, 出版商: {self.publisher} ({status})"

class Library:
    def __init__(self, name: str) -> None:
        self.name = name
        self._publications = []
        self._readers = []
        self._admins = []
        self._create_initial_admin()

    def _create_initial_admin(self):
        admin = Admin("系统管理员", "admin", "admin123", self)
        self._admins.append(admin)
        self._super_admin_id = "admin"

    def _is_super_admin(self, admin) -> bool:
        return hasattr(admin, 'admin_id') and admin.admin_id == self._super_admin_id

    def _check_permission(self, admin) -> bool:
        return admin in self._admins

    @property
    def publications(self): return self._publications.copy()
    @property
    def readers(self): return self._readers.copy()
    @property
    def admins(self): return self._admins.copy()

    def _add_publication(self, admin: 'Admin', publication: Publication) -> tuple[bool, str]:
        if not self._check_permission(admin):
            return False, "权限不足"
        
        if any(p.title == publication.title for p in self._publications):
            return False, "出版物已存在"
        
        self._publications.append(publication)
        return True, "添加成功"

    def _remove_publication(self, admin: 'Admin', title: str) -> tuple[bool, str]:
        if not self._check_permission(admin):
            return False, "权限不足"

        for pub in self._publications:
            if pub.title == title:
                self._publications.remove(pub)
                return True, "移除成功"
        return False, "出版物不存在"

    def _add_reader(self, admin: 'Admin', reader: 'Reader') -> tuple[bool, str]:
        if not self._check_permission(admin):
            return False, "权限不足"
            
        if any(r.reader_id == reader.reader_id for r in self._readers):
            return False, "读者ID已存在"

        self._readers.append(reader)
        return True, "添加成功"

    def get_publication(self, title: str) -> Optional[Publication]:
        return next((p for p in self._publications if p.title == title), None)

    def get_available_publications(self):
        return [p for p in self._publications if not p.is_borrowed]

    def get_reader(self, reader_id: str) -> Optional['Reader']:
        return next((r for r in self._readers if r.reader_id == reader_id), None)

    def get_admin(self, admin_id: str, password: str) -> Optional['Admin']:
        return next((a for a in self._admins if a.admin_id == admin_id and a.password == password), None)

class Admin:
    def __init__(self, name: str, admin_id: str, password: str, library: Library):
        self.name = name
        self.admin_id = admin_id
        self.password = password
        self.library = library

    def add_publication(self, publication: Publication) -> tuple[bool, str]:
        return self.library._add_publication(self, publication)

    def remove_publication(self, title: str) -> tuple[bool, str]:
        return self.library._remove_publication(self, title)

    def register_reader(self, reader: 'Reader') -> tuple[bool, str]:
        return self.library._add_reader(self, reader)

class Reader:
    def __init__(self, name: str, reader_id: str, password: str, max_borrow_limit: int = 3) -> None:
        self.name = name
        self.reader_id = reader_id
        self.password = password
        self._borrowed_items = []
        self._max_borrow_limit = max_borrow_limit

    @property
    def borrowed_items(self):
        return self._borrowed_items.copy()

    def send_borrow_message(self, library: Library, title: str, days: int = 14, **kwargs) -> tuple[bool, str]:
        if len(self._borrowed_items) >= self._max_borrow_limit:
            return False, f"已达到最大借阅数量（{self._max_borrow_limit}本）"
        
        publication = library.get_publication(title)
        
        if not publication:
            return False, f"图书馆没有《{title}》"
        
        success, message = publication.receive_borrow_message(self, days, **kwargs)
        
        if success:
            self._borrowed_items.append(publication)
        
        return success, message

    def get_remaining_quota(self) -> int:
        return self._max_borrow_limit - len(self._borrowed_items)

    def send_return_message(self, title: str) -> tuple[bool, str]:
        publication_to_return = None
        for item in self._borrowed_items:
            if item.title == title:
                publication_to_return = item
                break
        
        if not publication_to_return:
            return False, f"没有借阅《{title}》"
        
        result = publication_to_return.receive_return_message()

        if result:
            self._borrowed_items.remove(publication_to_return)
            return True, f"成功归还《{title}》"
        else:
            return False, "归还失败"

# 数据持久化函数
def save_data():
    """保存数据到JSON文件"""
    data = {
        'readers': [
            {
                'name': r.name,
                'reader_id': r.reader_id,
                'password': r.password,
                'max_borrow_limit': r._max_borrow_limit
            }
            for r in library._readers
        ],
        'publications': [
            {
                'type': 'book',
                'title': p.title,
                'author': p.author,
                'isbn': p.isbn,
                'category': p.category
            }
            for p in library._publications if isinstance(p, Book)
        ] + [
            {
                'type': 'magazine',
                'title': p.title,
                'issue': p.issue,
                'publisher': p.publisher,
                'is_latest': p._is_latest
            }
            for p in library._publications if isinstance(p, Magazine)
        ]
    }
    
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_data():
    """从JSON文件加载数据"""
    if not os.path.exists(DATA_FILE):
        return None
    
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return None

# 初始化图书馆
library = Library("图书馆管理系统")

# 尝试加载已保存的数据
saved_data = load_data()

if saved_data:
    # 加载读者数据
    for reader_data in saved_data.get('readers', []):
        reader = Reader(
            reader_data['name'],
            reader_data['reader_id'],
            reader_data['password'],
            reader_data.get('max_borrow_limit', 3)
        )
        library._readers.append(reader)
    
    # 加载出版物数据
    admin = library.admins[0]
    for pub_data in saved_data.get('publications', []):
        if pub_data['type'] == 'book':
            book = Book(
                pub_data['title'],
                pub_data['author'],
                pub_data['isbn'],
                pub_data['category']
            )
            admin.add_publication(book)
        elif pub_data['type'] == 'magazine':
            magazine = Magazine(
                pub_data['title'],
                pub_data['issue'],
                pub_data['publisher']
            )
            if pub_data.get('is_latest', False):
                magazine.mark_as_latest()
            admin.add_publication(magazine)
else:
    # 首次运行，添加示例数据
    admin = library.admins[0]
    book1 = Book("Python编程从入门到实践", "Eric Matthes", "9787115428028", "编程")
    book2 = Book("设计模式", "刘溪", "9787111075752", "软件工程")
    book3 = Book("数据结构与算法", "作者A", "111111", "计算机")
    admin.add_publication(book1)
    admin.add_publication(book2)
    admin.add_publication(book3)

    magazine1 = Magazine("计算机科学", "2023-10", "科学出版社")
    magazine1.mark_as_latest()
    admin.add_publication(magazine1)
    
    # 保存初始数据
    save_data()

# 路由
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        reader_id = request.form.get('reader_id')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # 验证密码
        if password != confirm_password:
            flash('两次输入的密码不一致')
            return render_template('register.html')
        
        # 检查读者ID是否已存在
        if library.get_reader(reader_id):
            flash('该读者ID已被注册')
            return render_template('register.html')
        
        # 创建新读者（不需要管理员权限）
        reader = Reader(name, reader_id, password)
        library._readers.append(reader)
        
        # 保存数据
        save_data()
        
        flash('注册成功！请登录')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user_type = request.form.get('user_type')
        user_id = request.form.get('user_id')
        password = request.form.get('password')
        
        if user_type == 'admin':
            admin = library.get_admin(user_id, password)
            if admin:
                session['user_type'] = 'admin'
                session['user_id'] = user_id
                session['user_name'] = admin.name
                return redirect(url_for('admin_dashboard'))
            else:
                flash('管理员账号或密码错误')
        else:
            reader = library.get_reader(user_id)
            if reader and reader.password == password:
                session['user_type'] = 'reader'
                session['user_id'] = user_id
                session['user_name'] = reader.name
                return redirect(url_for('reader_dashboard'))
            else:
                flash('读者账号或密码错误')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/admin/dashboard')
def admin_dashboard():
    if session.get('user_type') != 'admin':
        return redirect(url_for('login'))
    
    publications = library.publications
    readers = library.readers
    return render_template('admin_dashboard.html', publications=publications, readers=readers)

@app.route('/admin/add_book', methods=['POST'])
def add_book():
    if session.get('user_type') != 'admin':
        return redirect(url_for('login'))
    
    title = request.form.get('title')
    author = request.form.get('author')
    isbn = request.form.get('isbn')
    category = request.form.get('category')
    
    admin = library.get_admin(session['user_id'], '')
    if admin:
        book = Book(title, author, isbn, category)
        success, message = admin.add_publication(book)
        flash(message)
        
        # 保存数据
        if success:
            save_data()
    
    return redirect(url_for('admin_dashboard'))

@app.route('/reader/dashboard')
def reader_dashboard():
    if session.get('user_type') != 'reader':
        return redirect(url_for('login'))
    
    reader = library.get_reader(session['user_id'])
    publications = library.get_available_publications()
    
    return render_template('reader_dashboard.html', reader=reader, publications=publications)

@app.route('/reader/borrow', methods=['POST'])
def borrow_book():
    if session.get('user_type') != 'reader':
        return redirect(url_for('login'))
    
    title = request.form.get('title')
    reader = library.get_reader(session['user_id'])
    
    if reader:
        success, message = reader.send_borrow_message(library, title)
        flash(message)
    
    return redirect(url_for('reader_dashboard'))

@app.route('/reader/return', methods=['POST'])
def return_book():
    if session.get('user_type') != 'reader':
        return redirect(url_for('login'))
    
    title = request.form.get('title')
    reader = library.get_reader(session['user_id'])
    
    if reader:
        success, message = reader.send_return_message(title)
        flash(message)
    
    return redirect(url_for('reader_dashboard'))

if __name__ == '__main__':
    app.run(debug=True)
