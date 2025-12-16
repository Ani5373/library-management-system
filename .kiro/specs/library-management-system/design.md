# 设计文档

## 概述

图书馆管理系统是一个全栈 Web 应用程序，采用前后端分离架构。前端使用 Vue 3 + TypeScript + Vite 构建现代化的单页应用（SPA），后端使用 Node.js + Express + TypeScript 提供 RESTful API 服务，数据库采用 PostgreSQL 存储关系型数据。系统支持三种用户角色（读者、管理员、超级管理员），提供完整的图书馆数字化管理功能。

## 架构

### 整体架构

系统采用三层架构：

```
┌─────────────────────────────────────────┐
│         前端层 (Vue 3 SPA)              │
│  - 用户界面组件                          │
│  - 状态管理 (Pinia)                     │
│  - 路由管理 (Vue Router)                │
│  - HTTP 客户端 (Axios)                  │
└─────────────────┬───────────────────────┘
                  │ REST API (JSON)
┌─────────────────▼───────────────────────┐
│      应用层 (Node.js + Express)         │
│  - 路由控制器                            │
│  - 业务逻辑服务                          │
│  - 认证中间件 (JWT)                     │
│  - 数据验证                              │
└─────────────────┬───────────────────────┘
                  │ SQL
┌─────────────────▼───────────────────────┐
│       数据层 (PostgreSQL)               │
│  - 用户表                                │
│  - 出版物表                              │
│  - 借阅记录表                            │
│  - 预约记录表                            │
│  - 罚款记录表                            │
└─────────────────────────────────────────┘
```

### 技术栈

**前端：**
- Vue 3 (Composition API)
- TypeScript
- Vite (构建工具)
- Pinia (状态管理)
- Vue Router (路由)
- Axios (HTTP 客户端)
- Element Plus (UI 组件库)
- Tailwind CSS (样式框架)

**后端：**
- Node.js 18+
- Express.js
- TypeScript
- Prisma (ORM)
- JWT (认证)
- bcrypt (密码加密)
- express-validator (数据验证)

**数据库：**
- PostgreSQL 14+

**开发工具：**
- ESLint + Prettier (代码规范)
- Vitest (单元测试)
- fast-check (属性测试)

## 组件和接口

### 前端组件结构

```
src/
├── components/           # 可复用组件
│   ├── common/          # 通用组件
│   │   ├── AppHeader.vue
│   │   ├── AppSidebar.vue
│   │   ├── LoadingSpinner.vue
│   │   └── ErrorMessage.vue
│   ├── publication/     # 出版物相关组件
│   │   ├── PublicationCard.vue
│   │   ├── PublicationList.vue
│   │   ├── PublicationDetail.vue
│   │   └── PublicationSearch.vue
│   ├── borrow/          # 借阅相关组件
│   │   ├── BorrowRecordList.vue
│   │   ├── BorrowRecordItem.vue
│   │   └── RenewButton.vue
│   ├── reservation/     # 预约相关组件
│   │   ├── ReservationList.vue
│   │   └── ReservationButton.vue
│   ├── review/          # 评价相关组件
│   │   ├── ReviewList.vue
│   │   ├── ReviewForm.vue
│   │   └── RatingStars.vue
│   └── admin/           # 管理员组件
│       ├── PublicationForm.vue
│       ├── ReaderForm.vue
│       └── StatisticsPanel.vue
├── views/               # 页面视图
│   ├── LoginView.vue
│   ├── reader/
│   │   ├── HomeView.vue
│   │   ├── SearchView.vue
│   │   ├── BorrowHistoryView.vue
│   │   ├── ReservationView.vue
│   │   └── ProfileView.vue
│   ├── admin/
│   │   ├── DashboardView.vue
│   │   ├── PublicationManageView.vue
│   │   ├── ReaderManageView.vue
│   │   └── StatisticsView.vue
│   └── superadmin/
│       ├── SystemConfigView.vue
│       └── AdminManageView.vue
├── stores/              # Pinia 状态管理
│   ├── auth.ts
│   ├── publication.ts
│   ├── borrow.ts
│   └── notification.ts
├── services/            # API 服务
│   ├── api.ts
│   ├── authService.ts
│   ├── publicationService.ts
│   ├── borrowService.ts
│   └── reservationService.ts
├── types/               # TypeScript 类型定义
│   ├── user.ts
│   ├── publication.ts
│   ├── borrow.ts
│   └── api.ts
├── router/              # 路由配置
│   └── index.ts
└── utils/               # 工具函数
    ├── validators.ts
    ├── formatters.ts
    └── constants.ts
```

### 后端 API 结构

```
src/
├── controllers/         # 控制器
│   ├── authController.ts
│   ├── publicationController.ts
│   ├── borrowController.ts
│   ├── reservationController.ts
│   ├── fineController.ts
│   └── adminController.ts
├── services/            # 业务逻辑服务
│   ├── authService.ts
│   ├── publicationService.ts
│   ├── borrowService.ts
│   ├── reservationService.ts
│   ├── fineService.ts
│   ├── notificationService.ts
│   └── searchService.ts
├── models/              # 数据模型（Prisma）
│   └── schema.prisma
├── middleware/          # 中间件
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── validator.ts
├── routes/              # 路由定义
│   ├── authRoutes.ts
│   ├── publicationRoutes.ts
│   ├── borrowRoutes.ts
│   └── adminRoutes.ts
├── types/               # TypeScript 类型
│   ├── user.ts
│   ├── publication.ts
│   └── api.ts
└── utils/               # 工具函数
    ├── jwt.ts
    ├── password.ts
    └── validators.ts
```

### 核心接口定义

#### 用户相关接口

```typescript
// 用户基础接口
interface User {
  userId: string;
  username: string;
  password: string;  // 加密后的密码
  name: string;
  email: string;
  phone: string;
  registrationDate: Date;
  lastLoginTime: Date;
  role: 'reader' | 'admin' | 'superadmin';
}

// 读者接口
interface Reader extends User {
  readerId: string;
  borrowLimit: number;
  borrowedCount: number;
  membershipLevel: string;
  creditScore: number;
  totalFines: number;
}

// 管理员接口
interface Admin extends User {
  adminId: string;
  role: string;
  department: string;
}
```

#### 出版物相关接口

```typescript
// 出版物基础接口
interface Publication {
  publicationId: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: Date;
  status: 'available' | 'borrowed' | 'reserved' | 'unavailable';
  borrowPeriod: number;
  location: string;
  totalCopies: number;
  availableCopies: number;
  averageRating: number;
  totalRatings: number;
  categoryId: string;
  type: 'book' | 'magazine' | 'ebook';
}

// 书籍接口
interface Book extends Publication {
  isbn: string;
  category: string;
  pages: number;
  language: string;
  edition: string;
}

// 期刊接口
interface Magazine extends Publication {
  issn: string;
  issueNumber: string;
  volume: string;
}

// 电子书接口
interface EBook extends Publication {
  fileFormat: string;
  fileSize: number;
  downloadUrl: string;
  downloadCount: number;
  simultaneousUsers: number;
}
```

#### 借阅相关接口

```typescript
// 借阅记录接口
interface BorrowRecord {
  recordId: string;
  readerId: string;
  publicationId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: 'borrowed' | 'returned' | 'overdue';
  renewalCount: number;
  maxRenewals: number;
}

// 预约记录接口
interface Reservation {
  reservationId: string;
  readerId: string;
  publicationId: string;
  reservationDate: Date;
  expiryDate: Date;
  status: 'pending' | 'ready' | 'cancelled' | 'expired';
  priority: number;
}

// 罚款记录接口
interface Fine {
  fineId: string;
  readerId: string;
  borrowRecordId: string;
  amount: number;
  reason: string;
  issueDate: Date;
  paymentDate: Date | null;
  status: 'unpaid' | 'paid' | 'waived';
}
```

### REST API 端点

#### 认证 API

```
POST   /api/auth/login              # 用户登录
POST   /api/auth/logout             # 用户登出
POST   /api/auth/refresh            # 刷新令牌
PUT    /api/auth/password           # 修改密码
```

#### 出版物 API

```
GET    /api/publications            # 获取出版物列表
GET    /api/publications/:id        # 获取出版物详情
GET    /api/publications/search     # 搜索出版物
POST   /api/publications            # 创建出版物（管理员）
PUT    /api/publications/:id        # 更新出版物（管理员）
DELETE /api/publications/:id        # 删除出版物（管理员）
GET    /api/publications/:id/reviews # 获取出版物评价
```

#### 借阅 API

```
GET    /api/borrows                 # 获取借阅记录
GET    /api/borrows/:id             # 获取借阅记录详情
POST   /api/borrows                 # 创建借阅记录
PUT    /api/borrows/:id/return      # 归还出版物
PUT    /api/borrows/:id/renew       # 续借出版物
```

#### 预约 API

```
GET    /api/reservations            # 获取预约记录
POST   /api/reservations            # 创建预约
DELETE /api/reservations/:id        # 取消预约
```

#### 罚款 API

```
GET    /api/fines                   # 获取罚款记录
POST   /api/fines/:id/pay           # 支付罚款
PUT    /api/fines/:id/waive         # 减免罚款（管理员）
```

#### 读者 API

```
GET    /api/readers                 # 获取读者列表（管理员）
GET    /api/readers/:id             # 获取读者详情
POST   /api/readers                 # 注册读者（管理员）
PUT    /api/readers/:id             # 更新读者信息
GET    /api/readers/:id/history     # 获取借阅历史
POST   /api/readers/:id/reviews     # 提交评价
```

#### 通知 API

```
GET    /api/notifications           # 获取通知列表
PUT    /api/notifications/:id/read  # 标记为已读
```

#### 统计 API

```
GET    /api/statistics              # 获取系统统计（管理员）
GET    /api/statistics/popular      # 获取热门出版物
GET    /api/statistics/active-readers # 获取活跃读者
POST   /api/reports                 # 生成报表（管理员）
```

## 数据模型

### 数据库表结构

#### users 表
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_time TIMESTAMP,
  role VARCHAR(20) NOT NULL CHECK (role IN ('reader', 'admin', 'superadmin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### readers 表
```sql
CREATE TABLE readers (
  reader_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  borrow_limit INTEGER DEFAULT 7,
  borrowed_count INTEGER DEFAULT 0,
  membership_level VARCHAR(20) DEFAULT 'basic',
  credit_score INTEGER DEFAULT 100,
  total_fines DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### admins 表
```sql
CREATE TABLE admins (
  admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  admin_role VARCHAR(50),
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### publications 表
```sql
CREATE TABLE publications (
  publication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  publisher VARCHAR(255),
  publish_date DATE,
  status VARCHAR(20) DEFAULT 'available',
  borrow_period INTEGER NOT NULL,
  location VARCHAR(100),
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(category_id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('book', 'magazine', 'ebook')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### books 表
```sql
CREATE TABLE books (
  book_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID UNIQUE NOT NULL REFERENCES publications(publication_id) ON DELETE CASCADE,
  isbn VARCHAR(20) UNIQUE,
  category VARCHAR(100),
  pages INTEGER,
  language VARCHAR(50),
  edition VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### magazines 表
```sql
CREATE TABLE magazines (
  magazine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID UNIQUE NOT NULL REFERENCES publications(publication_id) ON DELETE CASCADE,
  issn VARCHAR(20),
  issue_number VARCHAR(50),
  volume VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ebooks 表
```sql
CREATE TABLE ebooks (
  ebook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID UNIQUE NOT NULL REFERENCES publications(publication_id) ON DELETE CASCADE,
  file_format VARCHAR(20),
  file_size BIGINT,
  download_url VARCHAR(500),
  download_count INTEGER DEFAULT 0,
  simultaneous_users INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### categories 表
```sql
CREATE TABLE categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL,
  parent_category_id UUID REFERENCES categories(category_id),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### borrow_records 表
```sql
CREATE TABLE borrow_records (
  record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_id UUID NOT NULL REFERENCES readers(reader_id),
  publication_id UUID NOT NULL REFERENCES publications(publication_id),
  borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NOT NULL,
  return_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'borrowed',
  renewal_count INTEGER DEFAULT 0,
  max_renewals INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### reservations 表
```sql
CREATE TABLE reservations (
  reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_id UUID NOT NULL REFERENCES readers(reader_id),
  publication_id UUID NOT NULL REFERENCES publications(publication_id),
  reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### fines 表
```sql
CREATE TABLE fines (
  fine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_id UUID NOT NULL REFERENCES readers(reader_id),
  borrow_record_id UUID REFERENCES borrow_records(record_id),
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### notifications 表
```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  send_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### reviews 表
```sql
CREATE TABLE reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_id UUID NOT NULL REFERENCES readers(reader_id),
  publication_id UUID NOT NULL REFERENCES publications(publication_id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reader_id, publication_id)
);
```

### 数据关系

- User 与 Reader/Admin 是一对一关系
- Publication 与 Book/Magazine/EBook 是一对一关系
- Reader 与 BorrowRecord 是一对多关系
- Reader 与 Reservation 是一对多关系
- Reader 与 Fine 是一对多关系
- Reader 与 Review 是一对多关系
- Publication 与 BorrowRecord 是一对多关系
- Publication 与 Reservation 是一对多关系
- Publication 与 Review 是一对多关系
- BorrowRecord 与 Fine 是一对一关系
- Category 与 Publication 是一对多关系
- Category 自引用（父子分类）


## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 认证与授权属性

Property 1: 有效凭据登录成功
*对于任何*有效的用户凭据（用户名和密码），登录操作应该返回成功状态和有效的 JWT 令牌
**验证需求：1.1**

Property 2: 无效凭据登录失败
*对于任何*无效的用户凭据（错误密码或不存在的用户名），登录操作应该返回失败状态且不生成令牌
**验证需求：1.2**

Property 3: 登录更新最后登录时间
*对于任何*成功的登录操作，用户的最后登录时间应该被更新为当前时间
**验证需求：1.3**

Property 4: 登出清除会话
*对于任何*有效的登出请求，用户的会话令牌应该被标记为无效
**验证需求：1.4**

### 出版物搜索属性

Property 5: 标题搜索返回匹配结果
*对于任何*标题关键词搜索，返回的所有出版物标题都应该包含该关键词（不区分大小写）
**验证需求：2.1**

Property 6: 作者搜索返回该作者作品
*对于任何*作者名称搜索，返回的所有出版物的作者字段都应该匹配该作者名称
**验证需求：2.2**

Property 7: ISBN/ISSN 搜索返回唯一出版物
*对于任何*有效的 ISBN 或 ISSN，搜索应该返回唯一对应的出版物或空结果
**验证需求：2.3**

Property 8: 分类搜索返回该分类出版物
*对于任何*分类 ID，返回的所有出版物都应该属于该分类或其子分类
**验证需求：2.4, 13.5**

Property 9: 出版物详情包含必需字段
*对于任何*出版物 ID，返回的详情应该包含标题、作者、出版社、状态、可借数量和平均评分字段
**验证需求：2.5**

Property 10: 高级搜索满足所有条件
*对于任何*多条件搜索，返回的所有出版物都应该同时满足所有指定的搜索条件
**验证需求：2.6**

### 借阅管理属性

Property 11: 借阅减少可借数量
*对于任何*成功的借阅操作，出版物的可借数量应该减少 1，且借阅记录应该被创建
**验证需求：3.1**

Property 12: 借阅归还往返一致性
*对于任何*出版物，借阅然后立即归还应该使可借数量恢复到原始值
**验证需求：3.4**

Property 13: 逾期归还生成罚款
*对于任何*逾期天数大于 0 的归还操作，应该生成罚款记录，且罚款金额等于逾期天数乘以 0.5 元
**验证需求：3.5, 5.1**

Property 14: 续借延长应还日期
*对于任何*续借次数未达上限的借阅记录，续借操作应该将应还日期延长借阅期限天数，且续借次数增加 1
**验证需求：3.6**

### 预约系统属性

Property 15: 预约创建设置优先级
*对于任何*新预约，系统应该创建预约记录并根据预约时间设置优先级（先预约先服务）
**验证需求：4.1**

Property 16: 预约通知按优先级发送
*对于任何*出版物变为可借状态时，如果存在预约队列，应该按优先级从高到低通知预约读者
**验证需求：4.2**

Property 17: 取消预约删除记录
*对于任何*预约记录，取消操作应该删除该预约记录并触发下一位预约者的通知
**验证需求：4.3**

### 罚款管理属性

Property 18: 罚款金额计算正确
*对于任何*逾期天数，罚款金额应该等于逾期天数乘以每日罚款率（0.5 元）
**验证需求：5.1**

Property 19: 罚款查询返回所有记录
*对于任何*读者，查询罚款记录应该返回该读者的所有罚款（包括已支付和未支付）
**验证需求：5.2**

Property 20: 支付罚款更新状态和总额
*对于任何*未支付的罚款，支付操作应该将罚款状态更新为已支付，并减少读者的罚款总额
**验证需求：5.3**

### 评价系统属性

Property 21: 提交评价保存内容
*对于任何*有效的评价（评分 1-5 和评论内容），系统应该保存评价记录
**验证需求：6.1**

Property 22: 评价更新平均评分
*对于任何*新提交的评价，出版物的平均评分应该重新计算为所有评分的算术平均值
**验证需求：6.2**

Property 23: 编辑评价更新内容
*对于任何*读者自己的评价，编辑操作应该更新评论内容和评分
**验证需求：6.3**

Property 24: 删除评价重新计算评分
*对于任何*评价删除操作，出版物的平均评分应该基于剩余评价重新计算
**验证需求：6.4**

Property 25: 查看评价返回所有评论
*对于任何*出版物，查询评价应该返回该出版物的所有评论和评分
**验证需求：6.5**

### 通知系统属性

Property 26: 即将到期触发提醒
*对于任何*距离应还日期少于 3 天的借阅记录，系统应该发送到期提醒通知
**验证需求：7.1**

Property 27: 逾期触发通知
*对于任何*应还日期已过且未归还的借阅记录，系统应该发送逾期通知
**验证需求：7.2**

Property 28: 预约可借触发通知
*对于任何*状态变为可借的出版物，如果存在待处理的预约，系统应该发送预约到书通知
**验证需求：7.3**

Property 29: 登录显示未读数量
*对于任何*用户登录，系统应该返回该用户的未读通知数量
**验证需求：7.4**

Property 30: 查看通知标记已读
*对于任何*通知查看操作，该通知的已读状态应该被设置为 true
**验证需求：7.5**

### 管理员出版物管理属性

Property 31: 上架创建记录和库存
*对于任何*新出版物上架操作，系统应该创建出版物记录并设置总数量和可借数量相等
**验证需求：8.1**

Property 32: 书籍借阅期限为 30 天
*对于任何*类型为书籍的出版物，借阅期限应该被设置为 30 天
**验证需求：8.2**

Property 33: 期刊借阅期限为 7 天
*对于任何*类型为期刊的出版物，借阅期限应该被设置为 7 天
**验证需求：8.3**

Property 34: 修改出版物更新记录
*对于任何*出版物修改操作，指定字段的值应该被更新为新值
**验证需求：8.4**

Property 35: 下架更新状态
*对于任何*下架操作，出版物的状态应该被更新为不可借
**验证需求：8.5**

Property 36: 分配分类关联记录
*对于任何*出版物和分类，分配操作应该将出版物的分类 ID 设置为指定分类
**验证需求：8.6**

### 管理员读者管理属性

Property 37: 注册读者设置初始值
*对于任何*新读者注册，借阅上限应该设置为 7，信用分数应该设置为 100
**验证需求：9.1, 9.2**

Property 38: 修改读者更新记录
*对于任何*读者修改操作，指定字段的值应该被更新为新值
**验证需求：9.3**

Property 39: 读者详情包含完整信息
*对于任何*读者 ID，查询详情应该返回借阅历史、罚款记录和信用分数
**验证需求：9.4**

### 管理员借阅处理属性

Property 40: 管理员借阅验证资格
*对于任何*管理员发起的借阅操作，系统应该验证读者的借阅资格（借阅上限、信用分数）
**验证需求：10.1**

Property 41: 管理员归还检查逾期
*对于任何*管理员发起的归还操作，系统应该检查是否逾期并在逾期时生成罚款
**验证需求：10.2**

Property 42: 处理预约通知读者
*对于任何*预约处理操作，系统应该发送通知给预约读者
**验证需求：10.3**

Property 43: 减免罚款更新状态
*对于任何*罚款减免操作，罚款状态应该被更新为已减免
**验证需求：10.4**

### 统计报表属性

Property 44: 统计信息计算正确
*对于任何*统计查询，返回的出版物总数、读者总数、借阅总数应该等于数据库中对应记录的实际数量
**验证需求：11.1, 11.2**

Property 45: 热门出版物按借阅次数排序
*对于任何*热门出版物查询，返回的列表应该按借阅次数从高到低排序
**验证需求：11.3**

Property 46: 活跃读者按借阅次数排序
*对于任何*活跃读者查询，返回的列表应该按借阅次数从高到低排序
**验证需求：11.4**

Property 47: 生成报表创建记录
*对于任何*报表生成请求，系统应该创建报表记录并包含生成时间和生成人信息
**验证需求：11.5**

### 超级管理员系统管理属性

Property 48: 注册管理员创建账户
*对于任何*新管理员注册，系统应该创建管理员账户并分配指定的角色
**验证需求：12.1**

Property 49: 删除管理员禁用账户
*对于任何*管理员删除操作，该管理员账户应该被标记为禁用状态
**验证需求：12.2**

Property 50: 配置系统更新规则
*对于任何*系统配置操作，借阅规则参数应该被更新为新值
**验证需求：12.3**

Property 51: 数据备份创建文件
*对于任何*备份请求，系统应该导出包含所有表数据的备份文件
**验证需求：12.4**

Property 52: 数据恢复往返一致性
*对于任何*数据库状态，备份然后恢复应该得到相同的数据
**验证需求：12.5**

### 分类目录管理属性

Property 53: 创建分类设置父分类
*对于任何*新分类创建，如果指定了父分类 ID，系统应该正确关联父子分类关系
**验证需求：13.1, 13.2**

Property 54: 修改分类更新记录
*对于任何*分类修改操作，指定字段的值应该被更新为新值
**验证需求：13.3**

Property 55: 分类树形结构正确
*对于任何*分类查询，返回的树形结构应该正确反映父子分类关系
**验证需求：13.4**

### 电子书管理属性

Property 56: 下载电子书增加次数
*对于任何*电子书下载操作，下载次数应该增加 1
**验证需求：14.1**

Property 57: 在线阅读检查用户数限制
*对于任何*在线阅读请求，系统应该检查当前在线用户数是否小于同时在线用户数限制
**验证需求：14.2**

Property 58: 电子书详情包含文件信息
*对于任何*电子书 ID，查询详情应该返回文件格式、文件大小和下载次数
**验证需求：14.4**

### 个性化推荐属性

Property 59: 推荐基于借阅历史
*对于任何*读者，推荐的出版物应该与该读者的借阅历史中的分类或作者相关
**验证需求：15.1, 15.2**

Property 60: 推荐优先高评分
*对于任何*推荐列表，高评分出版物应该排在低评分出版物之前
**验证需求：15.3**

Property 61: 推荐包含理由
*对于任何*推荐出版物，返回的数据应该包含推荐理由字段
**验证需求：15.4**

### 数据验证属性

Property 62: 表单验证检查必填字段
*对于任何*表单提交，如果缺少必填字段，验证应该失败并返回错误信息
**验证需求：17.1**

Property 63: 邮箱格式验证
*对于任何*邮箱输入，如果不符合标准邮箱格式（包含 @ 和域名），验证应该失败
**验证需求：17.2**

Property 64: 电话格式验证
*对于任何*电话号码输入，如果不符合有效的电话号码格式，验证应该失败
**验证需求：17.3**

Property 65: 网络错误提供重试
*对于任何*网络请求失败，系统应该显示错误提示并提供重试选项
**验证需求：17.5**

### 会员等级系统属性

Property 66: 按时归还增加信用分数
*对于任何*按时归还操作（归还日期 <= 应还日期），读者的信用分数应该增加
**验证需求：18.1**

Property 67: 逾期归还减少信用分数
*对于任何*逾期归还操作（归还日期 > 应还日期），读者的信用分数应该减少
**验证需求：18.2**

Property 68: 信用分数达标提升等级
*对于任何*读者，当信用分数达到等级阈值时，会员等级应该被提升
**验证需求：18.3**

Property 69: 等级提升增加借阅上限
*对于任何*会员等级提升操作，读者的借阅上限应该相应增加
**验证需求：18.4**

Property 70: 个人信息显示等级和分数
*对于任何*读者查询个人信息，返回的数据应该包含当前会员等级和信用分数
**验证需求：18.5**

## 错误处理

### 错误类型

系统定义以下错误类型：

1. **认证错误（AuthenticationError）**
   - 无效的凭据
   - 令牌过期
   - 令牌无效
   - 未授权访问

2. **验证错误（ValidationError）**
   - 必填字段缺失
   - 数据格式错误
   - 数据范围超出限制
   - 唯一性约束冲突

3. **业务逻辑错误（BusinessLogicError）**
   - 借阅上限已达
   - 信用分数不足
   - 出版物不可借
   - 续借次数超限
   - 重复预约

4. **资源错误（ResourceError）**
   - 资源不存在
   - 资源已被删除
   - 资源状态冲突

5. **系统错误（SystemError）**
   - 数据库连接失败
   - 文件操作失败
   - 外部服务不可用

### 错误响应格式

所有 API 错误响应遵循统一格式：

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // 错误代码
    message: string;        // 用户友好的错误消息
    details?: any;          // 详细错误信息（可选）
    timestamp: string;      // 错误发生时间
    path: string;           // 请求路径
  };
}
```

### 错误处理策略

**前端错误处理：**
- 使用 Axios 拦截器统一处理 HTTP 错误
- 显示用户友好的错误提示（使用 Element Plus 的 Message 组件）
- 对于网络错误提供重试机制
- 对于认证错误自动跳转到登录页面
- 记录错误日志到控制台（开发环境）

**后端错误处理：**
- 使用全局错误处理中间件捕获所有错误
- 区分操作错误和程序错误
- 操作错误返回适当的 HTTP 状态码和错误信息
- 程序错误记录详细日志并返回通用错误消息
- 数据库错误转换为业务错误
- 验证错误返回具体的字段错误信息

### HTTP 状态码使用

- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 409: 资源冲突
- 422: 验证失败
- 500: 服务器内部错误

## 测试策略

### 单元测试

单元测试用于验证单个函数、类或组件的正确性。

**前端单元测试：**
- 使用 Vitest 作为测试框架
- 测试 Vue 组件的渲染和交互
- 测试 Pinia store 的状态管理逻辑
- 测试工具函数和验证器
- 测试 API 服务层（使用 mock）

**后端单元测试：**
- 使用 Vitest 作为测试框架
- 测试业务逻辑服务层
- 测试数据验证函数
- 测试工具函数（JWT、密码加密等）
- 使用 mock 隔离数据库依赖

**单元测试覆盖范围：**
- 核心业务逻辑函数
- 数据验证和转换函数
- 错误处理逻辑
- 边缘情况（空值、边界值等）

### 属性测试

属性测试用于验证系统的通用属性在大量随机输入下都能保持正确。

**属性测试框架：**
- 使用 fast-check 作为属性测试库
- 每个属性测试至少运行 100 次迭代
- 使用智能生成器生成符合约束的测试数据

**属性测试标注：**
- 每个属性测试必须使用注释标注对应的设计文档属性
- 格式：`// Feature: library-management-system, Property X: [属性描述]`
- 每个正确性属性必须对应一个属性测试

**属性测试覆盖范围：**
- 认证和授权逻辑
- 借阅和归还的往返一致性
- 罚款金额计算
- 评分平均值计算
- 搜索结果过滤
- 数据备份和恢复的往返一致性
- 排序和优先级逻辑
- 信用分数和会员等级计算

**测试数据生成器：**
```typescript
// 示例：生成随机读者
const readerArbitrary = fc.record({
  readerId: fc.uuid(),
  borrowLimit: fc.integer({ min: 1, max: 20 }),
  borrowedCount: fc.integer({ min: 0, max: 20 }),
  creditScore: fc.integer({ min: 0, max: 200 }),
  membershipLevel: fc.constantFrom('basic', 'silver', 'gold', 'platinum')
});

// 示例：生成随机出版物
const publicationArbitrary = fc.record({
  publicationId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  author: fc.string({ minLength: 1, maxLength: 50 }),
  totalCopies: fc.integer({ min: 1, max: 100 }),
  availableCopies: fc.integer({ min: 0, max: 100 }),
  type: fc.constantFrom('book', 'magazine', 'ebook')
});
```

### 集成测试

集成测试验证多个组件协同工作的正确性。

**API 集成测试：**
- 测试完整的 API 请求-响应流程
- 使用测试数据库（与生产数据库隔离）
- 测试认证和授权流程
- 测试数据库事务和回滚
- 测试错误处理和边界情况

**前端集成测试：**
- 测试页面级别的用户交互流程
- 测试路由导航
- 测试状态管理和 API 调用的集成
- 使用 mock API 响应

### 端到端测试

端到端测试验证完整的用户场景。

**测试场景：**
- 用户注册和登录流程
- 搜索和借阅出版物流程
- 归还和续借流程
- 预约和取消预约流程
- 支付罚款流程
- 管理员管理出版物流程
- 管理员查看统计报表流程

**测试工具：**
- 可选使用 Playwright 或 Cypress 进行 E2E 测试
- 在 CI/CD 流程中自动运行

### 测试执行顺序

1. 先实现功能代码
2. 编写单元测试验证核心逻辑
3. 编写属性测试验证通用属性
4. 编写集成测试验证组件协作
5. 运行所有测试确保通过

### 测试覆盖率目标

- 单元测试代码覆盖率：> 80%
- 属性测试：覆盖所有设计文档中的正确性属性
- 集成测试：覆盖所有主要 API 端点
- 端到端测试：覆盖所有关键用户流程

### 持续集成

- 每次代码提交自动运行所有测试
- 测试失败阻止代码合并
- 生成测试覆盖率报告
- 属性测试失败时保存反例用于调试
