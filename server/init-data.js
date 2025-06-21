const pool = require('./db');
const mysql = require('mysql2/promise');

async function initData() {
  // 检查命令行参数
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset') || args.includes('-r');

  let connection;

  try {
    if (shouldReset) {
      console.log('🔄 重置模式：将删除并重建整个数据库...');

      // 连接到MySQL服务器（不指定数据库）
      connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'cody1991',
      });

      console.log('已连接到MySQL服务器');

      // 删除数据库（如果存在）
      await connection.execute('DROP DATABASE IF EXISTS milkywayidle');
      console.log('🗑️  已删除旧数据库 milkywayidle');

      // 重新创建数据库
      await connection.execute(
        'CREATE DATABASE milkywayidle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
      );
      console.log('✅ 已重新创建数据库 milkywayidle');

      // 切换到新数据库
      await connection.query('USE milkywayidle');

      // 创建所有表结构
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
      console.log('✓ users 表已创建');

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
      console.log('✓ leaderboard 表已创建');

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
      console.log('✓ chat_messages 表已创建');

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
      console.log('✓ production_activities 表已创建');

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
      console.log('✓ user_resources 表已创建');

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
      console.log('✓ user_modules 表已创建');

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
      console.log('✓ user_units 表已创建');

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
      console.log('✓ unit_definitions 表已创建');

      console.log('✅ 数据库结构重建完成');

      // 关闭连接，准备使用pool连接
      await connection.end();
    }

    console.log('开始初始化游戏数据...');

    // 初始化单位定义（unit_definitions）
    const unitDefinitions = [
      {
        module_id: 'cow',
        unit_id: 'normalCow',
        name: '奶牛',
        base_production: 1,
        action_time: 3000,
        required_level: 1,
        description: '基础的奶牛，可以挤奶',
      },
      {
        module_id: 'cow',
        unit_id: 'greenCow',
        name: '翠绿奶牛',
        base_production: 1,
        action_time: 4000,
        required_level: 2,
        description: '更高级的奶牛，产奶量更高',
      },
      {
        module_id: 'cow',
        unit_id: 'blueCow',
        name: '蔚蓝奶牛',
        base_production: 1,
        action_time: 5000,
        required_level: 3,
        description: '稀有奶牛，产奶量很高',
      },
      {
        module_id: 'cow',
        unit_id: 'purpleCow',
        name: '深紫奶牛',
        base_production: 1,
        action_time: 6000,
        required_level: 4,
        description: '传说奶牛，产奶量极高',
      },
      {
        module_id: 'cow',
        unit_id: 'crimsonCow',
        name: '绛红奶牛',
        base_production: 1,
        action_time: 7000,
        required_level: 5,
        description: '史诗奶牛，产奶量惊人',
      },
      {
        module_id: 'cow',
        unit_id: 'rainbowCow',
        name: '彩虹奶牛',
        base_production: 1,
        action_time: 8000,
        required_level: 6,
        description: '神话奶牛，产奶量超群',
      },
      {
        module_id: 'cow',
        unit_id: 'divineCow',
        name: '神圣奶牛',
        base_production: 1,
        action_time: 10000,
        required_level: 7,
        description: '神圣奶牛，产奶量无与伦比',
      },
      {
        module_id: 'wood',
        unit_id: 'normalTree',
        name: '树',
        base_production: 1,
        action_time: 4000,
        required_level: 1,
        description: '基础的树，可以伐木',
      },
      {
        module_id: 'wood',
        unit_id: 'birchTree',
        name: '桦树',
        base_production: 1,
        action_time: 5000,
        required_level: 2,
        description: '更高级的树，木材质量更好',
      },
      {
        module_id: 'wood',
        unit_id: 'cedarTree',
        name: '雪松树',
        base_production: 1,
        action_time: 6000,
        required_level: 3,
        description: '稀有树木，木材质量很高',
      },
      {
        module_id: 'wood',
        unit_id: 'purpleHeartTree',
        name: '紫心树',
        base_production: 1,
        action_time: 7000,
        required_level: 4,
        description: '传说树木，木材质量极高',
      },
      {
        module_id: 'wood',
        unit_id: 'ginkgoTree',
        name: '银杏树',
        base_production: 1,
        action_time: 8000,
        required_level: 5,
        description: '史诗树木，木材质量惊人',
      },
      {
        module_id: 'wood',
        unit_id: 'redwoodTree',
        name: '红杉树',
        base_production: 1,
        action_time: 9000,
        required_level: 6,
        description: '神话树木，木材质量超群',
      },
      {
        module_id: 'wood',
        unit_id: 'mysteryTree',
        name: '奥秘树',
        base_production: 1,
        action_time: 12000,
        required_level: 7,
        description: '奥秘树木，木材质量无与伦比',
      },
      {
        module_id: 'harvest',
        unit_id: 'spaceBerry',
        name: '太空莓',
        base_production: 1,
        action_time: 2500,
        required_level: 1,
        description: '基础的太空莓，可以采摘',
      },
      {
        module_id: 'harvest',
        unit_id: 'starfruit',
        name: '杨桃',
        base_production: 1,
        action_time: 3500,
        required_level: 2,
        description: '更高级的水果，营养价值更高',
      },
      {
        module_id: 'harvest',
        unit_id: 'spaceCoffee',
        name: '太空咖啡豆',
        base_production: 1,
        action_time: 4500,
        required_level: 3,
        description: '稀有咖啡豆，品质很高',
      },
      {
        module_id: 'harvest',
        unit_id: 'radiantFiber',
        name: '光辉纤维',
        base_production: 1,
        action_time: 6000,
        required_level: 4,
        description: '传说纤维，品质无与伦比',
      },
    ];

    console.log('正在初始化单位定义数据...');
    for (const unit of unitDefinitions) {
      await pool.query(
        'INSERT IGNORE INTO unit_definitions (module_id, unit_id, name, base_production, action_time, required_level, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          unit.module_id,
          unit.unit_id,
          unit.name,
          unit.base_production,
          unit.action_time,
          unit.required_level,
          unit.description,
        ],
      );
    }
    console.log('✅ 单位定义数据初始化完成');

    // 检查初始化结果
    const [count] = await pool.query(
      'SELECT COUNT(*) as count FROM unit_definitions',
    );
    console.log(`📊 数据库中现有 ${count[0].count} 个单位定义`);

    if (shouldReset) {
      console.log('\n🎉 数据库重置和游戏数据初始化完成！');
      console.log('所有用户数据已清除，游戏已重置为初始状态');
    } else {
      console.log('\n🎉 游戏数据初始化完成！');
    }
    console.log('现在可以启动游戏服务器了');
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    await pool.end();
  }
}

// 显示使用说明
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
使用方法: node init-data.js [选项]

选项:
  --reset, -r    删除并重建整个数据库（清除所有用户数据）
  --help, -h     显示此帮助信息

示例:
  node init-data.js          # 只初始化数据，保留现有用户数据
  node init-data.js --reset  # 删除并重建数据库，清除所有数据
  `);
  process.exit(0);
}

initData();
