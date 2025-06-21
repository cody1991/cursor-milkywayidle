# 银河奶牛放置游戏服务器

## 环境配置

### 环境变量

创建 `.env` 文件并配置以下环境变量：

```bash
# 环境配置
NODE_ENV=development  # development 或 production

# 服务器配置
PORT=3001

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=milkyway_idle

# CORS配置（生产环境）
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 启动脚本

```bash
# 开发环境（带热重载）
npm run dev

# 开发环境（不带热重载）
npm run start:dev

# 生产环境
npm run start:prod

# 默认启动（生产环境）
npm start
```

### 环境差异

#### 开发环境 (development)

- 详细的日志输出
- 显示 WebSocket 消息
- 显示活动日志
- 显示数据库日志
- 禁用 CSP（内容安全策略）
- 允许所有 CORS 来源

#### 生产环境 (production)

- 仅显示错误日志
- 隐藏详细调试信息
- 启用 CSP
- 限制 CORS 来源
- 优化的性能配置

### 日志级别

- 🚀 启动信息
- 📝 HTTP 请求
- 🔌 WebSocket 连接
- 📨 WebSocket 消息
- 💬 聊天消息
- 🏆 成就相关
- 📊 分数相关
- 🚀 活动开始
- ⏹️ 活动停止
- ⚠️ 警告信息
- ❌ 错误信息
- 🧹 清理任务

## 数据库初始化

### 1. 初始化数据库和表结构

```bash
node init-db.js
```

这个脚本会：

- 检查并创建 `milkywayidle` 数据库（如果不存在）
- 创建所有必要的表结构
- 设置正确的外键约束和索引

### 2. 初始化游戏数据

```bash
node init-data.js
```

这个脚本会：

- 初始化所有单位定义数据
- 插入 18 个游戏单位到 `unit_definitions` 表

### 3. 启动服务器

```bash
node server.js
```

## 数据库结构

### 主要表

- `users` - 用户信息
- `leaderboard` - 排行榜
- `chat_messages` - 聊天消息
- `production_activities` - 生产活动
- `user_resources` - 用户资源
- `user_modules` - 用户模块
- `user_units` - 用户单位
- `unit_definitions` - 单位定义

### 配置

数据库连接配置在 `db.js` 文件中：

- 主机：localhost
- 用户：root
- 密码：cody1991
- 数据库：milkywayidle

## 开发说明

- 使用 WebSocket 进行实时通信
- 所有游戏数据存储在 MySQL 数据库中
- 支持多用户同时在线
- 自动计算用户等级和经验
