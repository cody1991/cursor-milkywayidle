const pool = require('./db');

async function initData() {
  try {
    console.log('开始初始化单位定义数据...');

    // 单位定义数据
    const unitDefinitions = [
      // cow模块
      {
        module_id: 'cow',
        unit_id: 'normalCow',
        name: '奶牛',
        base_production: 1,
        action_time: 3000,
        required_level: 1,
        score: 1,
        description: '基础的奶牛，可以挤奶',
      },
      {
        module_id: 'cow',
        unit_id: 'greenCow',
        name: '翠绿奶牛',
        base_production: 1,
        action_time: 4000,
        required_level: 20,
        score: 2,
        description: '更高级的奶牛，产奶量更高',
      },
      {
        module_id: 'cow',
        unit_id: 'blueCow',
        name: '蔚蓝奶牛',
        base_production: 1,
        action_time: 5000,
        required_level: 60,
        score: 5,
        description: '稀有奶牛，产奶量很高',
      },
      {
        module_id: 'cow',
        unit_id: 'purpleCow',
        name: '深紫奶牛',
        base_production: 1,
        action_time: 6000,
        required_level: 120,
        score: 10,
        description: '传说奶牛，产奶量极高',
      },
      {
        module_id: 'cow',
        unit_id: 'crimsonCow',
        name: '绛红奶牛',
        base_production: 1,
        action_time: 7000,
        required_level: 200,
        score: 25,
        description: '史诗奶牛，产奶量惊人',
      },
      {
        module_id: 'cow',
        unit_id: 'rainbowCow',
        name: '彩虹奶牛',
        base_production: 1,
        action_time: 8000,
        required_level: 300,
        score: 50,
        description: '神话奶牛，产奶量超群',
      },
      {
        module_id: 'cow',
        unit_id: 'divineCow',
        name: '神圣奶牛',
        base_production: 1,
        action_time: 10000,
        required_level: 400,
        score: 100,
        description: '神圣奶牛，产奶量无与伦比',
      },
      // wood模块
      {
        module_id: 'wood',
        unit_id: 'normalTree',
        name: '树',
        base_production: 1,
        action_time: 4000,
        required_level: 1,
        score: 1,
        description: '基础的树，可以伐木',
      },
      {
        module_id: 'wood',
        unit_id: 'birchTree',
        name: '桦树',
        base_production: 1,
        action_time: 5000,
        required_level: 20,
        score: 2,
        description: '更高级的树，木材质量更好',
      },
      {
        module_id: 'wood',
        unit_id: 'cedarTree',
        name: '雪松树',
        base_production: 1,
        action_time: 6000,
        required_level: 60,
        score: 5,
        description: '稀有树木，木材质量很高',
      },
      {
        module_id: 'wood',
        unit_id: 'purpleHeartTree',
        name: '紫心树',
        base_production: 1,
        action_time: 7000,
        required_level: 120,
        score: 10,
        description: '传说树木，木材质量极高',
      },
      {
        module_id: 'wood',
        unit_id: 'ginkgoTree',
        name: '银杏树',
        base_production: 1,
        action_time: 8000,
        required_level: 200,
        score: 25,
        description: '史诗树木，木材质量惊人',
      },
      {
        module_id: 'wood',
        unit_id: 'redwoodTree',
        name: '红杉树',
        base_production: 1,
        action_time: 9000,
        required_level: 300,
        score: 50,
        description: '神话树木，木材质量超群',
      },
      {
        module_id: 'wood',
        unit_id: 'mysteryTree',
        name: '奥秘树',
        base_production: 1,
        action_time: 12000,
        required_level: 400,
        score: 100,
        description: '奥秘树木，木材质量无与伦比',
      },
      // harvest模块
      {
        module_id: 'harvest',
        unit_id: 'spaceBerry',
        name: '太空莓',
        base_production: 1,
        action_time: 2500,
        required_level: 1,
        score: 1,
        description: '基础的太空莓，可以采摘',
      },
      {
        module_id: 'harvest',
        unit_id: 'starfruit',
        name: '杨桃',
        base_production: 1,
        action_time: 3500,
        required_level: 60,
        score: 2,
        description: '更高级的水果，营养价值更高',
      },
      {
        module_id: 'harvest',
        unit_id: 'spaceCoffee',
        name: '太空咖啡豆',
        base_production: 1,
        action_time: 4500,
        required_level: 200,
        score: 5,
        description: '稀有咖啡豆，品质很高',
      },
      {
        module_id: 'harvest',
        unit_id: 'radiantFiber',
        name: '光辉纤维',
        base_production: 1,
        action_time: 6000,
        required_level: 400,
        score: 10,
        description: '传说纤维，品质无与伦比',
      },
    ];

    // 使用 ON DUPLICATE KEY UPDATE 进行 upsert
    for (const unit of unitDefinitions) {
      await pool.query(
        `INSERT INTO unit_definitions (module_id, unit_id, name, base_production, action_time, required_level, score, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           base_production = VALUES(base_production),
           action_time = VALUES(action_time),
           required_level = VALUES(required_level),
           score = VALUES(score),
           description = VALUES(description)`,
        [
          unit.module_id,
          unit.unit_id,
          unit.name,
          unit.base_production,
          unit.action_time,
          unit.required_level,
          unit.score,
          unit.description,
        ],
      );
    }

    console.log('✅ 单位定义数据初始化/更新完成');
    const [count] = await pool.query(
      'SELECT COUNT(*) as count FROM unit_definitions',
    );
    console.log(`📊 数据库中现有 ${count[0].count} 个单位定义`);
    console.log('🎉 数据初始化完成！');
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
    process.exit(1);
  } finally {
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
