from datetime import datetime, timedelta
from typing import Optional

from flask import (
    Flask,
    flash,
    get_flashed_messages,
    redirect,
    render_template_string,
    request,
    url_for,
)

class Publication:
    """出版物基类 - 演示继承和多态"""
    
    def __init__(self, title: str) -> None:
        self.title = title
        self._is_borrowed = False  # 保护属性：借阅状态
        self._borrower = None      # 保护属性：当前借阅者
        self._due_date = None      # 保护属性：应归还日期

    @property
    def is_borrowed(self) -> bool:
        """是否被借出 - 只读属性"""
        return self._is_borrowed

    @property
    def borrower(self):
        """当前借阅者 - 只读属性"""
        return self._borrower

    @property
    def due_date(self):
        """应归还日期 - 只读属性"""
        return self._due_date

    def get_max_loan_days(self) -> int:
        """获取最大借阅天数 - 子类必须重写"""
        raise NotImplementedError("子类必须实现此方法")

    def receive_borrow_message(self, reader, days: int = None, **kwargs) -> tuple[bool, str]:
        """处理借阅消息 - 演示消息传递"""
        """
        如果出版物可以借出，计算借出的天数。修改内部_is_borrowed、_borrower、_due_date属性，返回（True, 借阅成功的消息）
        否则，返回（False, 书已被xxx借出，预计xxx时间归还）
        """
        if self._is_borrowed:
            # 已被借出，返回错误信息
            due_date_str = self._due_date.strftime('%Y-%m-%d') if self._due_date else '未知'
            return False, f"书已被{self._borrower.name}借出，预计{due_date_str}归还"
        
        # 可以借出
        if days is None:
            days = self.get_max_loan_days()
        
        # 验证天数
        if days <= 0:
            return False, "借阅天数必须大于0"
        
        self._is_borrowed = True
        self._borrower = reader
        self._due_date = datetime.now() + timedelta(days=days)
        
        return True, f"借阅成功，请于{self._due_date.strftime('%Y-%m-%d')}前归还"

    def receive_return_message(self) -> bool:
        """处理归还消息"""
        if self._is_borrowed:
            self._is_borrowed = False
            self._borrower = None
            self._due_date = None
            return True
        return False

    def get_description(self) -> str:
        """获取描述 - 子类必须重写"""
        raise NotImplementedError("子类必须实现此方法")

class Book(Publication):
    """图书类 - 演示继承和多态"""
    
    def __init__(self, title: str, author: str, isbn: str, category: str = "技术") -> None:
        super().__init__(title)
        self.author = author      # 公有属性
        self.isbn = isbn          # 公有属性
        self.category = category  # 公有属性

    def get_max_loan_days(self) -> int:
        """书籍最大借阅14天"""
        return 14

    def get_description(self) -> str:
        return f"📚《{self.title}》- 作者: {self.author}, 分类: {self.category}"

class Magazine(Publication):
    """
    定义Magazine类，继承自Publication
    属性：issue-杂志期号，公有属性；publisher-出版商，公有属性；_is_latest，保护属性
    方法: mark_as_latest();mark_as_archive();get_max_loan_days();get_description()
    """
    
    def __init__(self, title: str, issue: str, publisher: str) -> None:
        super().__init__(title)
        self.issue = issue          # 公有属性：杂志期号
        self.publisher = publisher  # 公有属性：出版商
        self._is_latest = False     # 保护属性：是否为最新期刊
    
    def mark_as_latest(self) -> None:
        """标记为最新期刊"""
        self._is_latest = True
    
    def mark_as_archive(self) -> None:
        """标记为过刊"""
        self._is_latest = False
    
    def get_max_loan_days(self) -> int:
        """杂志最大借阅天数：最新期刊7天，过刊14天"""
        return 7 if self._is_latest else 14
    
    def get_description(self) -> str:
        """获取杂志描述"""
        status = "最新期刊" if self._is_latest else "过刊"
        return f"📰《{self.title}》- 期号: {self.issue}, 出版商: {self.publisher} ({status})"

class Library:
    """数据存储 - 使用基类方法检查权限"""
    
    def __init__(self, name: str) -> None:
        self.name = name
        self._publications = []
        self._readers = []
        self._admins = []
        self._create_initial_admin()

    def _create_initial_admin(self):
        """创建初始超级管理员"""
        admin = Admin("系统管理员", "admin001", self)
        self._admins.append(admin)
        # 设置第一个管理员为超级管理员
        self._super_admin_id = "admin001"

    # 检查是否为超级管理员
    def _is_super_admin(self, admin) -> bool:
        """检查是否为超级管理员"""
        return hasattr(admin, 'admin_id') and admin.admin_id == self._super_admin_id

    # 统一的权限检查方法
    def _check_permission(self, admin) -> bool:
        return admin in self._admins

    # 只读属性
    @property
    def publications(self): return self._publications.copy()
    @property
    def readers(self): return self._readers.copy()
    @property
    def admins(self): return self._admins.copy()

    # 简化的数据操作方法
    def _add_publication(self, admin: 'Admin', publication: Publication) -> tuple[bool, str]:
        """
        返回操作结果和详细错误信息
        返回: (success: bool, message: str)
        """
        # 权限检查
        if not self._check_permission(admin):
            return False, "权限不足"
        
        # 数据完整性检查（核心业务规则）
        if any(p.title == publication.title for p in self._publications):
            return False, "出版物已存在"
        
        # 执行操作
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
            return False, "❌ 读者ID已存在"

        self._readers.append(reader)
        return True, "添加成功"

    def _add_admin(self, admin: 'Admin', new_admin: 'Admin') -> tuple[bool, str]:
        """添加管理员 - 只有超级管理员可以调用"""
        # 只有超级管理员可以添加管理员
        if not self._is_super_admin(admin):
            return False, "权限不足，只有超级管理员可以添加管理员"

        if any(a.admin_id == new_admin.admin_id for a in self._admins):
            return False, "❌ 管理员ID已存在"

        self._admins.append(new_admin)
        return True, "添加成功"

    # 查询方法
    def get_publication(self, title: str) -> Optional[Publication]:
        return next((p for p in self._publications if p.title == title), None)

    def get_available_publications(self):
        """获取可借阅的出版物 - 模板需要这个方法"""
        return [p for p in self._publications if not p.is_borrowed]

    def get_reader(self, reader_id: str) -> Optional['Reader']:
        """根据ID获取读者"""
        return next((r for r in self._readers if r.reader_id == reader_id), None)

class Admin:
    def __init__(self, name: str, admin_id: str, library: Library):
        self.name = name
        self.admin_id = admin_id
        self.library = library

    def add_publication(self, publication: Publication) -> str:
        """添加出版物"""
        success, message = self.library._add_publication(self, publication)
        
        if success:
            return f"✅ {self.name} 添加了: {publication.title}"
        else:
            return f"❌ {message}"

    def remove_publication(self, title: str) -> str:
        """移除出版物"""
        success, message = self.library._remove_publication(self, title)
        if success:
            return f"✅ {self.name} 移除了: {title}"
        else:
            return f"❌ {message}"

    def register_reader(self, reader: 'Reader') -> str:
        """注册读者"""
        success, message = self.library._add_reader(self, reader)
        if success:
            return f"✅ {self.name} 注册了读者: {reader.name}"
        else:
            return f"❌ {message}"

    def register_admin(self, new_admin: 'Admin') -> str:
        """注册新管理员 - 只有超级管理员可以注册"""
        success, message = self.library._add_admin(self, new_admin)
        if success:
            return f"✅ {self.name} 添加了管理员: {new_admin.name}"
        else:
            return f"❌ {message}"

class Reader:
    """读者类 - 只能借阅和查询"""
    
    def __init__(self, name: str, reader_id: str, max_borrow_limit: int = 3) -> None:
        self.name = name
        self.reader_id = reader_id
        self._borrowed_items = []     # 保护属性
        self._max_borrow_limit = max_borrow_limit  # 最大借阅数量限制

    @property
    def borrowed_items(self):
        """借阅列表 - 只读"""
        return self._borrowed_items.copy()

    def send_borrow_message(self, library: Library, title: str, days: int = 14, **kwargs) -> str:
        """
        根据出版物title属性，查询图书馆里是否存有该出版，如果有，获取该出版物publication
        然后调用publication.receive_borrow_message()
        如果借阅成功，更新读者的相关属性，返回成功借阅信息
        否则，返回错误信息
        """
        print(f"📨 {self.name} 请求借阅《{title}》")
        
        # 检查借阅数量限制
        if len(self._borrowed_items) >= self._max_borrow_limit:
            return f"❌ {self.name} 已达到最大借阅数量（{self._max_borrow_limit}本），请先归还后再借阅"
        
        # 查询图书馆是否有该出版物
        publication = library.get_publication(title)
        
        if not publication:
            return f"❌ 图书馆没有《{title}》"
        
        # 发送借阅消息给出版物
        success, message = publication.receive_borrow_message(self, days, **kwargs)
        
        if success:
            # 借阅成功，更新读者的借阅列表
            self._borrowed_items.append(publication)
            return f"✅ {self.name} {message}"
        else:
            # 借阅失败
            return f"❌ {message}"

    def get_remaining_quota(self) -> int:
        """获取剩余借阅额度"""
        return self._max_borrow_limit - len(self._borrowed_items)

    def send_return_message(self, title: str) -> str:
        """归还出版物"""
        print(f"📨 {self.name} 请求归还《{title}》")
        
        # 在借阅列表中查找
        publication_to_return = None
        for item in self._borrowed_items:
            if item.title == title:
                publication_to_return = item
                break
        
        if not publication_to_return:
            return f"❌ {self.name} 没有借阅《{title}》"
        
        # 发送归还消息给出版物
        result = publication_to_return.receive_return_message()

        # 从借阅列表中移除  
        if result:
            self._borrowed_items.remove(publication_to_return)    
            return f"✅ {self.name} 成功归还《{title}》"
        else:
            return f"❌ 信息不一致，请检查！！！"


app = Flask(__name__)
app.secret_key = "dev-secret"


# 初始化图书馆数据
library = Library("简易图书馆")
super_admin = library.admins[0]

# 预置几本书和读者，方便界面演示
seed_books = [
    Book("Python编程从入门到实践", "Eric Matthes", "9787115428028", "编程"),
    Book("设计模式", "刘溪", "9787111075752", "软件工程"),
    Book("数据结构与算法", "作者A", "111111", "计算机"),
]
for book in seed_books:
    super_admin.add_publication(book)

magazine = Magazine("计算机科学", "2023-10", "科学出版社")
magazine.mark_as_latest()
super_admin.add_publication(magazine)

super_admin.register_reader(Reader("张三", "2021001"))
super_admin.register_reader(Reader("李四", "2021002"))


INDEX_TEMPLATE = """
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{ library.name }}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#f7f7f7; margin:0; padding:0; }
    .container { max-width: 1100px; margin: 24px auto; background:#fff; padding:24px; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.08); }
    h1 { margin-top:0; }
    form { margin-bottom:16px; }
    label { display:block; margin:8px 0 4px; font-weight:600; }
    input, select { width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; }
    button { margin-top:10px; padding:10px 16px; background:#2563eb; color:#fff; border:none; border-radius:6px; cursor:pointer; }
    button:hover { background:#1d4ed8; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; }
    .card { border:1px solid #eee; border-radius:10px; padding:16px; background:#fafafa; }
    table { width:100%; border-collapse:collapse; margin-top:12px; }
    th, td { border-bottom:1px solid #eee; padding:8px; text-align:left; }
    .tag { display:inline-block; padding:2px 8px; background:#e0e7ff; color:#1e3a8a; border-radius:999px; font-size:12px; }
    .alert { padding:10px 12px; border-radius:6px; margin-bottom:8px; }
    .alert.success { background:#ecfdf3; color:#166534; }
    .alert.error { background:#fef2f2; color:#991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📚 {{ library.name }}</h1>

    {% with messages = get_flashed_messages(with_categories=true) %}
      {% if messages %}
        {% for category, msg in messages %}
          <div class="alert {{ 'success' if category == 'ok' else 'error' }}">{{ msg }}</div>
        {% endfor %}
      {% endif %}
    {% endwith %}

    <div class="grid">
      <div class="card">
        <h3>添加图书</h3>
        <form action="{{ url_for('add_book') }}" method="post">
          <label>书名</label>
          <input name="title" required />
          <label>作者</label>
          <input name="author" required />
          <label>ISBN</label>
          <input name="isbn" required />
          <label>分类</label>
          <input name="category" value="综合" />
          <button type="submit">添加</button>
        </form>
      </div>

      <div class="card">
        <h3>注册读者</h3>
        <form action="{{ url_for('add_reader') }}" method="post">
          <label>姓名</label>
          <input name="name" required />
          <label>读者ID</label>
          <input name="reader_id" required />
          <button type="submit">注册</button>
        </form>
      </div>

      <div class="card">
        <h3>借阅</h3>
        <form action="{{ url_for('borrow') }}" method="post">
          <label>读者ID</label>
          <input name="reader_id" required />
          <label>书名</label>
          <input name="title" required />
          <label>借阅天数（可选）</label>
          <input name="days" type="number" min="1" placeholder="默认按类型限制" />
          <button type="submit">借阅</button>
        </form>
      </div>

      <div class="card">
        <h3>归还</h3>
        <form action="{{ url_for('return_item') }}" method="post">
          <label>读者ID</label>
          <input name="reader_id" required />
          <label>书名</label>
          <input name="title" required />
          <button type="submit">归还</button>
        </form>
      </div>
    </div>

    <h2>馆藏情况</h2>
    <table>
      <tr><th>标题</th><th>类型</th><th>状态</th><th>借阅者</th><th>应还日期</th></tr>
      {% for pub in library.publications %}
        <tr>
          <td>{{ pub.title }}</td>
          <td>
            {% if pub.__class__.__name__ == 'Book' %}
              图书 <span class="tag">{{ pub.category }}</span>
            {% else %}
              杂志 <span class="tag">{{ pub.publisher }}</span>
            {% endif %}
          </td>
          <td>{{ '已借出' if pub.is_borrowed else '可借阅' }}</td>
          <td>{{ pub.borrower.name if pub.borrower else '-' }}</td>
          <td>{{ pub.due_date.strftime('%Y-%m-%d') if pub.due_date else '-' }}</td>
        </tr>
      {% endfor %}
    </table>

    <h2>读者借阅情况</h2>
    {% for reader in readers %}
      <div class="card" style="margin-bottom:10px;">
        <strong>{{ reader.name }}</strong> ({{ reader.reader_id }})
        <div>已借阅：{{ reader.borrowed_items|length }} 本，剩余额度：{{ reader.get_remaining_quota() }} 本</div>
        <ul>
          {% if reader.borrowed_items %}
            {% for item in reader.borrowed_items %}
              <li>{{ item.title }} - 应还：{{ item.due_date.strftime('%Y-%m-%d') if item.due_date else '-' }}</li>
            {% endfor %}
          {% else %}
            <li>暂无借阅</li>
          {% endif %}
        </ul>
      </div>
    {% endfor %}
  </div>
</body>
</html>
"""


def _flash_result(result: str):
    """根据文本前缀简单区分成功/失败消息"""
    category = "ok" if result.startswith("✅") else "error"
    flash(result, category)


@app.route("/", methods=["GET"])
def index():
    return render_template_string(
        INDEX_TEMPLATE,
        library=library,
        readers=library.readers,
        get_flashed_messages=get_flashed_messages,
    )


@app.route("/add-book", methods=["POST"])
def add_book():
    title = request.form.get("title", "").strip()
    author = request.form.get("author", "").strip()
    isbn = request.form.get("isbn", "").strip()
    category = request.form.get("category", "综合").strip() or "综合"

    if not (title and author and isbn):
        flash("❌ 请输入完整的图书信息", "error")
        return redirect(url_for("index"))

    result = super_admin.add_publication(Book(title, author, isbn, category))
    _flash_result(result)
    return redirect(url_for("index"))


@app.route("/add-reader", methods=["POST"])
def add_reader():
    name = request.form.get("name", "").strip()
    reader_id = request.form.get("reader_id", "").strip()

    if not (name and reader_id):
        flash("❌ 请输入完整的读者信息", "error")
        return redirect(url_for("index"))

    result = super_admin.register_reader(Reader(name, reader_id))
    _flash_result(result)
    return redirect(url_for("index"))


@app.route("/borrow", methods=["POST"])
def borrow():
    reader_id = request.form.get("reader_id", "").strip()
    title = request.form.get("title", "").strip()
    days_raw = request.form.get("days", "").strip()

    reader = library.get_reader(reader_id)
    if not reader:
        flash("❌ 未找到读者，请先注册", "error")
        return redirect(url_for("index"))

    days = None
    if days_raw:
        try:
            days = int(days_raw)
        except ValueError:
            flash("❌ 借阅天数必须是数字", "error")
            return redirect(url_for("index"))

    result = reader.send_borrow_message(library, title, days=days or None)
    _flash_result(result)
    return redirect(url_for("index"))


@app.route("/return", methods=["POST"])
def return_item():
    reader_id = request.form.get("reader_id", "").strip()
    title = request.form.get("title", "").strip()

    reader = library.get_reader(reader_id)
    if not reader:
        flash("❌ 未找到读者，请先注册", "error")
        return redirect(url_for("index"))

    result = reader.send_return_message(title)
    _flash_result(result)
    return redirect(url_for("index"))


if __name__ == "__main__":
    # 默认启动开发服务：python 1.py
    app.run(debug=True, port=8000)