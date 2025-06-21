# Galaxy Cow Idle 服务器端

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
