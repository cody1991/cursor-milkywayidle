-- Galaxy Cow Idle 游戏数据库结构
-- 使用说明：
-- 1. 运行 node init-db.js 创建数据库和表结构
-- 2. 运行 node init-data.js 初始化游戏数据

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  experience INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 排行榜表
CREATE TABLE IF NOT EXISTS leaderboard (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE,
  score BIGINT DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64),
  username VARCHAR(64),
  message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 生产活动表
CREATE TABLE IF NOT EXISTS production_activities (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  module_id VARCHAR(32) NOT NULL,
  unit_id VARCHAR(32) NOT NULL,
  times INT NOT NULL,
  current_times INT DEFAULT 0,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户资源表
CREATE TABLE IF NOT EXISTS user_resources (
  user_id VARCHAR(64),
  resource_name VARCHAR(32),
  amount DECIMAL(20,2) DEFAULT 0,
  max_amount DECIMAL(20,2) DEFAULT 1000,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, resource_name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户模块表
CREATE TABLE IF NOT EXISTS user_modules (
  user_id VARCHAR(64),
  module_id VARCHAR(32),
  current_level INT DEFAULT 1,
  experience INT DEFAULT 0,
  level_experience INT DEFAULT 100,
  unlocked BOOLEAN DEFAULT TRUE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, module_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户单位表
CREATE TABLE IF NOT EXISTS user_units (
  user_id VARCHAR(64),
  module_id VARCHAR(32),
  unit_id VARCHAR(32),
  owned INT DEFAULT 0,
  produced INT DEFAULT 0,
  unlocked BOOLEAN DEFAULT TRUE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, module_id, unit_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 单位定义表
CREATE TABLE IF NOT EXISTS unit_definitions (
  module_id VARCHAR(32),
  unit_id VARCHAR(32),
  name VARCHAR(64) NOT NULL,
  base_production INT DEFAULT 1,
  action_time INT NOT NULL,
  required_level INT DEFAULT 1,
  score INT DEFAULT 1,
  description TEXT,
  PRIMARY KEY (module_id, unit_id)
); 