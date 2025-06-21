const mysql = require('mysql2/promise');

async function initDatabase() {
  let connection;

  try {
    console.log('开始初始化数据库...');

    // 首先连接到MySQL服务器（不指定数据库）
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'cody1991',
    });

    console.log('已连接到MySQL服务器');

    // 检查数据库是否存在
    const [databases] = await connection.execute(
      'SHOW DATABASES LIKE "milkywayidle"',
    );

    if (databases.length === 0) {
      console.log('数据库 milkywayidle 不存在，正在创建...');
      await connection.execute(
        'CREATE DATABASE milkywayidle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
      );
      console.log('数据库 milkywayidle 创建成功');
    } else {
      console.log('数据库 milkywayidle 已存在');
    }

    // 切换到 milkywayidle 数据库
    await connection.query('USE milkywayidle');

    // 创建所有表
    console.log('开始创建表结构...');

    // 用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(64) NOT NULL UNIQUE,
        experience INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ users 表已创建/确认');

    // 排行榜表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(64) UNIQUE,
        score BIGINT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ leaderboard 表已创建/确认');

    // 聊天消息表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(64),
        username VARCHAR(64),
        message TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ chat_messages 表已创建/确认');

    // 生产活动表
    await connection.execute(`
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
      )
    `);
    console.log('✓ production_activities 表已创建/确认');

    // 用户资源表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_resources (
        user_id VARCHAR(64),
        resource_name VARCHAR(32),
        amount DECIMAL(20,2) DEFAULT 0,
        max_amount DECIMAL(20,2) DEFAULT 1000,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, resource_name),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ user_resources 表已创建/确认');

    // 用户模块表
    await connection.execute(`
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
      )
    `);
    console.log('✓ user_modules 表已创建/确认');

    // 用户单位表
    await connection.execute(`
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
      )
    `);
    console.log('✓ user_units 表已创建/确认');

    // 单位定义表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS unit_definitions (
        module_id VARCHAR(32),
        unit_id VARCHAR(32),
        name VARCHAR(64) NOT NULL,
        base_production INT DEFAULT 1,
        action_time INT NOT NULL,
        required_level INT DEFAULT 1,
        description TEXT,
        PRIMARY KEY (module_id, unit_id)
      )
    `);
    console.log('✓ unit_definitions 表已创建/确认');

    console.log('\n✅ 数据库和所有表结构初始化完成！');
    console.log('现在可以运行 node init-data.js 来初始化数据');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
