// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const pool = require('./db');

// 环境配置
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';
const isProduction = NODE_ENV === 'production';

console.log(`🚀 启动环境: ${NODE_ENV}`);
console.log(`📊 开发模式: ${isDevelopment}`);
console.log(`🏭 生产模式: ${isProduction}`);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3001;

// 中间件
app.use(
  helmet({
    contentSecurityPolicy: isProduction ? undefined : false, // 开发环境禁用CSP
  }),
);
app.use(
  cors({
    origin: isDevelopment
      ? '*'
      : process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  }),
);
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, '../web/dist')));

// 开发环境添加详细日志中间件
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// 存储连接的WebSocket客户端
const clients = new Map();

// WebSocket连接处理
wss.on('connection', async (ws, req) => {
  const userId = req.url.split('=')[1];
  clients.set(userId, ws);

  if (isDevelopment) {
    console.log(`🔌 用户 ${userId} 建立WebSocket连接`);
  }

  // 发送初始数据
  await sendInitialData(ws, userId);

  // 设置定时器，每2秒自动更新活动状态
  const activityUpdateInterval = setInterval(async () => {
    try {
      await handleUpdateActivities(userId);
    } catch (error) {
      console.error('定时更新活动错误:', error);
    }
  }, 2000);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      if (isDevelopment) {
        console.log('📨 收到WebSocket消息:', data.type, '来自用户:', userId);
      }

      switch (data.type) {
        case 'chat':
          await handleChatMessage(userId, data.message);
          break;
        case 'fetch_achievements':
          await handleFetchAchievements(ws, userId);
          break;
        case 'unlock_achievement':
          await handleUnlockAchievement(userId, data.achievementId);
          break;
        case 'submit_score':
          await handleSubmitScore(userId, data.score);
          break;
        case 'submit_score_and_sync_experience':
          await handleSubmitScoreAndSyncExperience(
            userId,
            data.score,
            data.units,
            data.unitDefinitions,
          );
          break;
        case 'fetch_leaderboard':
          await handleFetchLeaderboard(ws);
          break;
        case 'fetch_chat_history':
          await handleFetchChatHistory(ws);
          break;
        case 'start_activity':
          await handleStartActivity(
            userId,
            data.moduleId,
            data.unitId,
            data.times,
          );
          break;
        case 'stop_activity':
          await handleStopActivity(userId, data.activityId);
          break;
        case 'update_activities':
          await handleUpdateActivities(userId);
          break;
        case 'fetch_unit_definitions':
          await handleFetchUnitDefinitions(ws);
          break;
      }
    } catch (error) {
      console.error('WebSocket消息处理错误:', error);
    }
  });

  ws.on('close', () => {
    // 清除定时器
    clearInterval(activityUpdateInterval);
    clients.delete(userId);
    if (isDevelopment) {
      console.log(`🔌 用户 ${userId} 断开WebSocket连接`);
    }
  });
});

// 发送初始数据
async function sendInitialData(ws, userId) {
  try {
    // 初始化用户状态
    await initializeUserState(userId);

    // 发送用户状态
    await sendUserState(userId);

    // 发送活动列表
    await sendUserActivities(userId);

    // 获取单位定义
    await handleFetchUnitDefinitions(ws);

    // 获取排行榜数据
    await handleFetchLeaderboard(ws);

    if (isDevelopment) {
      console.log(`✅ 用户 ${userId} 初始数据发送完成`);
    }
  } catch (error) {
    console.error('❌ 发送初始数据错误:', error);
  }
}

// 处理聊天消息
async function handleChatMessage(userId, message) {
  try {
    // 先检查用户是否存在，如果不存在则创建
    const [existingUser] = await pool.query(
      'SELECT username FROM users WHERE id = ?',
      [userId],
    );

    let username;
    if (existingUser.length === 0) {
      // 用户不存在，创建一个临时用户
      username = `用户_${userId.slice(-6)}`;
      await pool.query('INSERT INTO users (id, username) VALUES (?, ?)', [
        userId,
        username,
      ]);
    } else {
      username = existingUser[0].username;
    }

    // 保存聊天消息到数据库
    await pool.query(
      'INSERT INTO chat_messages (user_id, username, message) VALUES (?, ?, ?)',
      [userId, username, message],
    );

    // 广播给所有客户端
    const chatData = {
      type: 'chat',
      userId,
      username,
      message,
      timestamp: new Date().toISOString(),
    };

    broadcastToAll(chatData);

    if (isDevelopment) {
      console.log(`💬 聊天消息: ${username}: ${message}`);
    }
  } catch (error) {
    console.error('❌ 保存聊天消息错误:', error);
  }
}

// 处理获取成就（简化版本，不涉及数据库）
async function handleFetchAchievements(ws, userId) {
  try {
    // 发送空的成就列表，让前端自己计算
    ws.send(
      JSON.stringify({
        type: 'achievements',
        data: [],
      }),
    );
  } catch (error) {
    console.error('❌ 获取成就错误:', error);
  }
}

// 处理解锁成就（简化版本，不涉及数据库）
async function handleUnlockAchievement(userId, achievementId) {
  try {
    // 只记录日志，不进行数据库操作
    if (isDevelopment) {
      console.log(`🏆 用户 ${userId} 解锁成就: ${achievementId}`);
    }

    // 可以在这里添加广播通知如果需要的话
    const achievementData = {
      type: 'achievement_unlocked',
      userId,
      achievementId,
    };

    broadcastToAll(achievementData);
  } catch (error) {
    console.error('❌ 解锁成就错误:', error);
  }
}

// 处理提交分数
async function handleSubmitScore(userId, score) {
  try {
    if (isDevelopment) {
      console.log(`📊 用户 ${userId} 提交分数: ${score}`);
    }

    await pool.query(
      'REPLACE INTO leaderboard (user_id, score) VALUES (?, ?)',
      [userId, score],
    );

    if (isDevelopment) {
      console.log(`💾 分数已保存到数据库: 用户=${userId}, 分数=${score}`);
    }

    // 广播排行榜更新
    const leaderboardData = {
      type: 'leaderboard_update',
      userId,
      score,
    };

    broadcastToAll(leaderboardData);

    // 重新发送排行榜给所有用户
    clients.forEach(async (client) => {
      if (client.readyState === WebSocket.OPEN) {
        await handleFetchLeaderboard(client);
      }
    });
  } catch (error) {
    console.error('❌ 提交分数错误:', error);
  }
}

// 处理提交分数并同步经验
async function handleSubmitScoreAndSyncExperience(
  userId,
  score,
  units,
  unitDefinitions,
) {
  try {
    if (isDevelopment) {
      console.log(`📊 用户 ${userId} 提交分数: ${score}`);
    }

    await pool.query(
      'REPLACE INTO leaderboard (user_id, score) VALUES (?, ?)',
      [userId, score],
    );

    if (isDevelopment) {
      console.log(`💾 分数已保存到数据库: 用户=${userId}, 分数=${score}`);
    }

    // 广播排行榜更新
    const leaderboardData = {
      type: 'leaderboard_update',
      userId,
      score,
    };

    broadcastToAll(leaderboardData);

    // 重新发送排行榜给所有用户
    clients.forEach(async (client) => {
      if (client.readyState === WebSocket.OPEN) {
        await handleFetchLeaderboard(client);
      }
    });

    // 同步经验
    await syncExperience(userId, units, unitDefinitions);
  } catch (error) {
    console.error('❌ 提交分数并同步经验错误:', error);
  }
}

// 处理获取排行榜
async function handleFetchLeaderboard(ws) {
  try {
    if (isDevelopment) {
      console.log('🏆 获取排行榜数据...');
    }

    const [rows] = await pool.query(`
      SELECT l.score, u.username, l.updated_at 
      FROM leaderboard l 
      JOIN users u ON l.user_id = u.id 
      ORDER BY l.score DESC 
      LIMIT 100
    `);

    if (isDevelopment) {
      console.log(`📊 排行榜数据: ${rows.length} 条记录`);
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.username}: ${row.score}`);
      });
    }

    ws.send(
      JSON.stringify({
        type: 'leaderboard',
        data: rows,
      }),
    );
  } catch (error) {
    console.error('❌ 获取排行榜错误:', error);
  }
}

// 处理获取聊天历史
async function handleFetchChatHistory(ws) {
  try {
    const [rows] = await pool.query(`
      SELECT user_id, username, message, sent_at as timestamp
      FROM chat_messages 
      ORDER BY sent_at DESC 
      LIMIT 100
    `);

    ws.send(
      JSON.stringify({
        type: 'chat_history',
        data: rows.reverse(),
      }),
    );
  } catch (error) {
    console.error('❌ 获取聊天历史错误:', error);
  }
}

// 广播给所有客户端
function broadcastToAll(data) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// API路由（保留一些基础接口用于兼容性）
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '银河奶牛放置服务器正在运行' });
});

// 用户注册/登录
app.post('/api/user/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        error: '用户名和密码不能为空',
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        error: '用户名长度必须在3-20个字符之间',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: '密码长度至少6个字符',
      });
    }

    // 先检查用户名是否已存在
    const [existingUser] = await pool.query(
      'SELECT id, username, password FROM users WHERE username = ?',
      [username],
    );

    let actualUserId;
    let isNewUser = false;

    if (existingUser.length > 0) {
      // 用户名已存在，验证密码
      const isValidPassword = await bcrypt.compare(
        password,
        existingUser[0].password,
      );

      if (!isValidPassword) {
        return res.status(401).json({
          error: '密码错误',
        });
      }

      actualUserId = existingUser[0].id;
      console.log(`用户 ${username} 登录成功，ID: ${actualUserId}`);
    } else {
      // 用户名不存在，创建新用户
      const hashedPassword = await bcrypt.hash(password, 10);
      actualUserId = `user_${username}_${Date.now()}`;

      await pool.query(
        'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
        [actualUserId, username, hashedPassword],
      );

      isNewUser = true;
      console.log(`新用户 ${username} 注册成功，ID: ${actualUserId}`);
    }

    res.json({
      success: true,
      userId: actualUserId,
      username,
      isNewUser,
    });
  } catch (error) {
    console.error('用户注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 游戏数据API
app.get('/api/game-data', (req, res) => {
  res.json({
    version: '1.0.0',
    serverTime: Date.now(),
    features: [
      'offline-progress',
      'cloud-save',
      'achievements',
      'leaderboard',
      'chat',
      'websocket',
      'cow-farming',
      'galaxy-theme',
    ],
  });
});

// 处理所有其他路由，返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/dist/index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 定期清理旧聊天消息（保留最近1000条）
async function cleanupOldChatMessages() {
  try {
    const [result] = await pool.query(`
      DELETE FROM chat_messages 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id FROM chat_messages 
          ORDER BY sent_at DESC 
          LIMIT 1000
        ) AS recent_messages
      )
    `);

    if (result.affectedRows > 0 && isDevelopment) {
      console.log(`🧹 清理了 ${result.affectedRows} 条旧聊天消息`);
    }
  } catch (error) {
    console.error('❌ 清理旧聊天消息错误:', error);
  }
}

// 启动服务器
server.listen(PORT, () => {
  console.log(`🐄 银河奶牛放置服务器运行在端口 ${PORT}`);
  console.log(`🌍 环境: ${NODE_ENV}`);

  if (isDevelopment) {
    console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`🎮 游戏: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  } else {
    console.log(`🎮 游戏已启动`);
    console.log(`🔌 WebSocket服务已启动`);
  }

  // 每小时清理一次旧消息
  setInterval(cleanupOldChatMessages, 60 * 60 * 1000);

  // 启动时立即清理一次
  cleanupOldChatMessages();
});

// 处理开始活动
async function handleStartActivity(userId, moduleId, unitId, times) {
  try {
    // 检查是否已有相同类型的活动在进行中
    const [existingActivity] = await pool.query(
      'SELECT * FROM production_activities WHERE user_id = ? AND module_id = ? AND unit_id = ? AND is_active = TRUE',
      [userId, moduleId, unitId],
    );

    if (existingActivity.length > 0) {
      if (isDevelopment) {
        console.log(
          `⚠️ 用户 ${userId} 尝试为已在生产中的单位 ${moduleId}.${unitId} 创建新活动`,
        );
      }

      // 发送错误消息给客户端
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'activity_error',
            message: '该单位已在生产中，请等待当前活动完成后再开始新的生产',
          }),
        );
      }
      return;
    }

    // 检查用户当前活跃活动数量，限制最多5个
    const [currentActivities] = await pool.query(
      'SELECT COUNT(*) as count FROM production_activities WHERE user_id = ? AND is_active = TRUE',
      [userId],
    );

    if (currentActivities[0].count >= 5) {
      if (isDevelopment) {
        console.log(
          `⚠️ 用户 ${userId} 尝试创建第6个活动，但已达到最大限制(5个)`,
        );
      }

      // 发送错误消息给客户端
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'activity_error',
            message: '已达到最大活动数量限制(5个)，请先停止一些活动',
          }),
        );
      }
      return;
    }

    // 检查用户是否有权限进行此活动
    const [userModule] = await pool.query(
      'SELECT * FROM user_modules WHERE user_id = ? AND module_id = ?',
      [userId, moduleId],
    );

    const [userUnit] = await pool.query(
      'SELECT * FROM user_units WHERE user_id = ? AND module_id = ? AND unit_id = ?',
      [userId, moduleId, unitId],
    );

    if (userModule.length === 0 || !userModule[0].unlocked) {
      if (isDevelopment) {
        console.log(`🔒 用户 ${userId} 尝试使用未解锁的模块 ${moduleId}`);
      }
      return;
    }

    if (userUnit.length === 0 || !userUnit[0].unlocked) {
      if (isDevelopment) {
        console.log(`🔒 用户 ${userId} 尝试使用未解锁的单位 ${unitId}`);
      }
      return;
    }

    if (userModule[0].current_level < getUnitRequiredLevel(unitId)) {
      if (isDevelopment) {
        console.log(`📊 用户 ${userId} 等级不足，无法使用单位 ${unitId}`);
      }
      return;
    }

    // 获取单位信息
    const unitInfo = await getUnitInfo(moduleId, unitId);
    if (!unitInfo) {
      if (isDevelopment) {
        console.log(`❓ 单位信息不存在: ${moduleId}.${unitId}`);
      }
      return;
    }

    const activityId = `activity_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const startTime = Date.now();

    // 对于无限次活动，设置一个很远的未来时间作为结束时间
    const endTime =
      times === -1
        ? startTime + 365 * 24 * 60 * 60 * 1000
        : startTime + unitInfo.actionTime * times; // 一年后

    // 创建活动记录
    await pool.query(
      'INSERT INTO production_activities (id, user_id, module_id, unit_id, times, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [activityId, userId, moduleId, unitId, times, startTime, endTime],
    );

    if (isDevelopment) {
      console.log(
        `🚀 用户 ${userId} 开始活动: ${unitInfo.name} x${
          times === -1 ? '无限' : times
        } (当前活动数: ${currentActivities[0].count + 1}/5)`,
      );
    }

    // 发送活动开始确认
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: 'activity_started',
          activityId,
          moduleId,
          unitId,
          times,
          startTime,
          endTime,
        }),
      );
    }
  } catch (error) {
    console.error('❌ 开始活动错误:', error);
  }
}

// 处理停止活动
async function handleStopActivity(userId, activityId) {
  try {
    await pool.query(
      'UPDATE production_activities SET is_active = FALSE WHERE id = ? AND user_id = ?',
      [activityId, userId],
    );

    if (isDevelopment) {
      console.log(`⏹️ 用户 ${userId} 停止活动: ${activityId}`);
    }

    // 发送活动停止确认
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: 'activity_stopped',
          activityId,
        }),
      );
    }
  } catch (error) {
    console.error('❌ 停止活动错误:', error);
  }
}

// 处理活动更新
async function handleUpdateActivities(userId) {
  try {
    const now = Date.now();

    // 获取用户的所有活动
    const [activities] = await pool.query(
      'SELECT * FROM production_activities WHERE user_id = ? AND is_active = TRUE',
      [userId],
    );

    for (const activity of activities) {
      const unitInfo = await getUnitInfo(activity.module_id, activity.unit_id);
      if (!unitInfo) continue;

      const elapsed = now - activity.start_time;
      const completedTimes = Math.floor(elapsed / unitInfo.actionTime);

      if (completedTimes >= activity.times && activity.times !== -1) {
        // 活动完成（非无限次）
        const actualCompleted = Math.min(completedTimes, activity.times);
        const totalProduction = actualCompleted * unitInfo.baseProduction;

        // 添加资源
        await addUserResource(
          userId,
          getResourceName(activity.module_id),
          totalProduction,
        );

        // 添加经验（按照单位分数计算）
        await addModuleExperience(
          userId,
          activity.module_id,
          actualCompleted * unitInfo.score,
        );

        // 添加分数（根据单位分数和生产数量）
        const scoreToAdd = actualCompleted * unitInfo.score;
        await addUserScore(userId, scoreToAdd);

        // 累计单位生产数量和拥有数量
        await addUserUnitProduction(
          userId,
          activity.module_id,
          activity.unit_id,
          totalProduction,
        );

        // 标记活动为完成
        await pool.query(
          'UPDATE production_activities SET is_active = FALSE, current_times = ? WHERE id = ?',
          [activity.times, activity.id],
        );

        console.log(
          `活动完成: ${activity.id}, 生产 ${totalProduction} 资源, 添加 ${
            actualCompleted * unitInfo.score
          } 经验, 添加 ${scoreToAdd} 分数`,
        );

        // 活动完成后立即发送用户状态更新
        await sendUserState(userId);
      } else if (completedTimes > activity.current_times) {
        // 更新进度（包括无限次活动）
        let actualCompleted;
        let totalProduction;

        if (activity.times === -1) {
          // 无限次活动：只计算新增的完成次数
          const newCompleted = completedTimes - activity.current_times;
          actualCompleted = completedTimes;
          totalProduction = newCompleted * unitInfo.baseProduction;
        } else {
          // 有限次活动：限制在设定次数内
          actualCompleted = Math.min(completedTimes, activity.times);
          totalProduction =
            (actualCompleted - activity.current_times) *
            unitInfo.baseProduction;
        }

        if (totalProduction > 0) {
          console.log(
            `准备更新活动 ${activity.id}: 当前次数=${activity.current_times}, 完成次数=${completedTimes}, 实际完成=${actualCompleted}, 生产=${totalProduction}`,
          );

          // 添加资源
          await addUserResource(
            userId,
            getResourceName(activity.module_id),
            totalProduction,
          );

          // 添加经验（按照单位分数计算）
          await addModuleExperience(
            userId,
            activity.module_id,
            (actualCompleted - activity.current_times) * unitInfo.score,
          );

          // 添加分数（根据单位分数和生产数量）
          const scoreToAdd =
            (actualCompleted - activity.current_times) * unitInfo.score;
          await addUserScore(userId, scoreToAdd);

          // 累计单位生产数量和拥有数量
          await addUserUnitProduction(
            userId,
            activity.module_id,
            activity.unit_id,
            totalProduction,
          );

          console.log(
            `活动进度更新: ${activity.id}, 生产 ${totalProduction} 资源, 添加 ${
              (actualCompleted - activity.current_times) * unitInfo.score
            } 经验, 添加 ${scoreToAdd} 分数`,
          );

          // 进度更新后立即发送用户状态更新，确保成就和积分及时更新
          await sendUserState(userId);
          console.log(`已发送用户状态更新给用户 ${userId}`);
        }

        // 更新当前次数
        await pool.query(
          'UPDATE production_activities SET current_times = ? WHERE id = ?',
          [actualCompleted, activity.id],
        );
      }
    }

    // 发送更新后的活动列表
    await sendUserActivities(userId);
  } catch (error) {
    console.error('更新活动错误:', error);
  }
}

// 辅助函数
async function getUnitInfo(moduleId, unitId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM unit_definitions WHERE module_id = ? AND unit_id = ?',
      [moduleId, unitId],
    );

    if (rows.length === 0) {
      console.warn(`未找到单位定义: ${moduleId}.${unitId}`);
      return null;
    }

    const unit = rows[0];
    return {
      name: unit.name,
      baseProduction: unit.base_production,
      actionTime: unit.action_time,
      requiredLevel: unit.required_level,
      score: unit.score,
      rarity: unit.rarity,
      description: unit.description,
    };
  } catch (error) {
    console.error('获取单位信息错误:', error);
    return null;
  }
}

function getUnitRequiredLevel(unitId) {
  const unitInfo = getUnitInfo(unitId.split('.')[0], unitId.split('.')[1]);
  return unitInfo?.requiredLevel || 1;
}

function getResourceName(moduleId) {
  const resourceMapping = {
    cow: 'milk',
    wood: 'wood',
    harvest: 'harvest',
  };
  return resourceMapping[moduleId] || moduleId;
}

async function addUserResource(userId, resourceName, amount) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // 使用事务确保原子性
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // 先获取当前资源数量
        const [currentResource] = await connection.query(
          'SELECT amount, max_amount FROM user_resources WHERE user_id = ? AND resource_name = ?',
          [userId, resourceName],
        );

        let newAmount;
        if (currentResource.length === 0) {
          // 用户还没有该资源记录，创建新记录
          newAmount = Math.min(amount, 1000); // 默认最大数量
          await connection.query(
            'INSERT INTO user_resources (user_id, resource_name, amount, max_amount) VALUES (?, ?, ?, ?)',
            [userId, resourceName, newAmount, 1000],
          );
        } else {
          // 用户已有该资源记录，原子性累加
          const maxAmount = currentResource[0].max_amount;
          newAmount = Math.min(currentResource[0].amount + amount, maxAmount);
          await connection.query(
            'UPDATE user_resources SET amount = ? WHERE user_id = ? AND resource_name = ?',
            [newAmount, userId, resourceName],
          );
        }

        await connection.commit();
        console.log(
          `用户 ${userId} 资源 ${resourceName} 增加 ${amount}，新数量: ${newAmount}`,
        );
        return; // 成功完成，退出重试循环
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      retryCount++;
      console.error(
        `增加用户资源错误 (尝试 ${retryCount}/${maxRetries}):`,
        error,
      );

      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries) {
        // 锁等待超时，等待一段时间后重试
        const waitTime = Math.min(1000 * retryCount, 3000);
        console.log(`锁等待超时，等待 ${waitTime}ms 后重试...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // 其他错误或已达到最大重试次数
      console.error('增加用户资源最终失败:', error);
      break;
    }
  }
}

async function addUserScore(userId, score) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // 使用事务确保原子性
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // 先获取当前分数
        const [currentScore] = await connection.query(
          'SELECT score FROM leaderboard WHERE user_id = ?',
          [userId],
        );

        let newScore;
        if (currentScore.length === 0) {
          // 用户还没有分数记录，创建新记录
          newScore = score;
          await connection.query(
            'INSERT INTO leaderboard (user_id, score) VALUES (?, ?)',
            [userId, newScore],
          );
        } else {
          // 用户已有分数记录，原子性累加
          newScore = currentScore[0].score + score;
          await connection.query(
            'UPDATE leaderboard SET score = ? WHERE user_id = ?',
            [newScore, userId],
          );
        }

        await connection.commit();
        console.log(`用户 ${userId} 分数增加 ${score}，新总分: ${newScore}`);
        return; // 成功完成，退出重试循环
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      retryCount++;
      console.error(
        `增加用户分数错误 (尝试 ${retryCount}/${maxRetries}):`,
        error,
      );

      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries) {
        // 锁等待超时，等待一段时间后重试
        const waitTime = Math.min(1000 * retryCount, 3000);
        console.log(`锁等待超时，等待 ${waitTime}ms 后重试...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // 其他错误或已达到最大重试次数
      console.error('增加用户分数最终失败:', error);
      break;
    }
  }
}

// 根据经验值计算等级和下一级所需经验
function calculateLevelFromExperience(experience) {
  let level = 1;
  let levelExperience = 100;
  let remainingExperience = experience;

  while (remainingExperience >= levelExperience && level < 500) {
    remainingExperience -= levelExperience;
    level += 1;
    levelExperience = Math.floor(levelExperience * 1.1);
  }

  // 如果达到500级，不再升级
  if (level >= 500) {
    level = 500;
    remainingExperience = Math.min(remainingExperience, levelExperience - 1);
  }

  return {
    level,
    currentExperience: remainingExperience,
    nextLevelExperience: level >= 500 ? 0 : levelExperience, // 500级时不再显示下一级经验
  };
}

async function addModuleExperience(userId, moduleId, experience) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // 使用事务确保原子性
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        const [userModule] = await connection.query(
          'SELECT experience FROM user_modules WHERE user_id = ? AND module_id = ?',
          [userId, moduleId],
        );

        let newExperience;
        if (userModule.length === 0) {
          // 用户还没有该模块记录，创建新记录
          newExperience = experience;
          await connection.query(
            'INSERT INTO user_modules (user_id, module_id, experience) VALUES (?, ?, ?)',
            [userId, moduleId, newExperience],
          );
        } else {
          // 用户已有该模块记录，原子性累加
          newExperience = userModule[0].experience + experience;
          await connection.query(
            'UPDATE user_modules SET experience = ? WHERE user_id = ? AND module_id = ?',
            [newExperience, userId, moduleId],
          );
        }

        // 计算新的等级信息
        const levelInfo = calculateLevelFromExperience(newExperience);

        // 解锁相应等级的单位
        await unlockUnitsByLevel(userId, moduleId, levelInfo.level);

        await connection.commit();
        console.log(
          `用户 ${userId} 模块 ${moduleId} 经验增加 ${experience}，新经验: ${newExperience}，新等级: ${levelInfo.level}`,
        );
        return; // 成功完成，退出重试循环
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      retryCount++;
      console.error(
        `增加模块经验错误 (尝试 ${retryCount}/${maxRetries}):`,
        error,
      );

      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries) {
        // 锁等待超时，等待一段时间后重试
        const waitTime = Math.min(1000 * retryCount, 3000);
        console.log(`锁等待超时，等待 ${waitTime}ms 后重试...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // 其他错误或已达到最大重试次数
      console.error('增加模块经验最终失败:', error);
      break;
    }
  }
}

async function unlockUnitsByLevel(userId, moduleId, level) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        const unitDefinitions = {
          cow: [
            'normalCow',
            'greenCow',
            'blueCow',
            'purpleCow',
            'crimsonCow',
            'rainbowCow',
            'divineCow',
          ],
          wood: [
            'normalTree',
            'birchTree',
            'cedarTree',
            'purpleHeartTree',
            'ginkgoTree',
            'redwoodTree',
            'mysteryTree',
          ],
          harvest: ['spaceBerry', 'starfruit', 'spaceCoffee', 'radiantFiber'],
        };

        const units = unitDefinitions[moduleId] || [];
        for (let i = 0; i < Math.min(level, units.length); i++) {
          const unitId = units[i];
          const unitInfo = await getUnitInfo(moduleId, unitId);
          if (unitInfo && unitInfo.requiredLevel <= level) {
            await connection.query(
              'INSERT INTO user_units (user_id, module_id, unit_id, unlocked) VALUES (?, ?, ?, TRUE) ON DUPLICATE KEY UPDATE unlocked = TRUE',
              [userId, moduleId, unitId],
            );
          }
        }

        await connection.commit();
        return; // 成功完成，退出重试循环
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      retryCount++;
      console.error(`解锁单位错误 (尝试 ${retryCount}/${maxRetries}):`, error);

      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries) {
        // 锁等待超时，等待一段时间后重试
        const waitTime = Math.min(1000 * retryCount, 3000);
        console.log(`锁等待超时，等待 ${waitTime}ms 后重试...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // 其他错误或已达到最大重试次数
      console.error('解锁单位最终失败:', error);
      break;
    }
  }
}

async function sendUserActivities(userId) {
  const [activities] = await pool.query(
    'SELECT * FROM production_activities WHERE user_id = ? AND is_active = TRUE',
    [userId],
  );

  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(
      JSON.stringify({
        type: 'activities_update',
        activities: activities.map((activity) => ({
          id: activity.id,
          moduleId: activity.module_id,
          unitId: activity.unit_id,
          times: activity.times,
          currentTimes: activity.current_times,
          startTime: activity.start_time,
          endTime: activity.end_time,
          isActive: Boolean(activity.is_active),
        })),
      }),
    );
  }
}

async function sendUserState(userId) {
  // 发送用户资源
  const [resources] = await pool.query(
    'SELECT resource_name, amount, max_amount FROM user_resources WHERE user_id = ?',
    [userId],
  );

  // 发送用户模块
  const [modules] = await pool.query(
    'SELECT module_id, experience, unlocked FROM user_modules WHERE user_id = ?',
    [userId],
  );

  // 发送用户单位
  const [units] = await pool.query(
    'SELECT module_id, unit_id, owned, unlocked, produced FROM user_units WHERE user_id = ?',
    [userId],
  );

  // 获取历史分数
  const [historicalScore] = await pool.query(
    'SELECT score FROM leaderboard WHERE user_id = ?',
    [userId],
  );

  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(
      JSON.stringify({
        type: 'user_state_update',
        resources: resources.reduce(
          (acc, r) => ({
            ...acc,
            [r.resource_name]: { amount: r.amount, maxAmount: r.max_amount },
          }),
          {},
        ),
        modules: modules.reduce((acc, m) => {
          const levelInfo = calculateLevelFromExperience(m.experience);
          return {
            ...acc,
            [m.module_id]: {
              currentLevel: levelInfo.level,
              experience: levelInfo.currentExperience,
              levelExperience: levelInfo.nextLevelExperience,
              unlocked: Boolean(m.unlocked),
            },
          };
        }, {}),
        units: units.reduce(
          (acc, u) => ({
            ...acc,
            [`${u.module_id}.${u.unit_id}`]: {
              owned: u.owned,
              unlocked: Boolean(u.unlocked),
              produced: u.produced || 0,
            },
          }),
          {},
        ),
        historicalScore:
          historicalScore.length > 0 ? historicalScore[0].score : 0,
      }),
    );
  }
}

// 初始化用户状态
async function initializeUserState(userId) {
  try {
    // 检查是否已有用户状态
    const [existingResources] = await pool.query(
      'SELECT COUNT(*) as count FROM user_resources WHERE user_id = ?',
      [userId],
    );

    if (existingResources[0].count === 0) {
      // 新用户，初始化状态
      console.log(`初始化新用户状态: ${userId}`);

      // 初始化资源
      await pool.query(
        'INSERT INTO user_resources (user_id, resource_name, amount, max_amount) VALUES (?, ?, ?, ?)',
        [userId, 'milk', 0, 1000],
      );
      await pool.query(
        'INSERT INTO user_resources (user_id, resource_name, amount, max_amount) VALUES (?, ?, ?, ?)',
        [userId, 'harvest', 0, 1000],
      );
      await pool.query(
        'INSERT INTO user_resources (user_id, resource_name, amount, max_amount) VALUES (?, ?, ?, ?)',
        [userId, 'wood', 0, 1000],
      );

      // 初始化模块（所有模块都解锁）
      await pool.query(
        'INSERT INTO user_modules (user_id, module_id, experience, unlocked) VALUES (?, ?, ?, ?)',
        [userId, 'cow', 0, true],
      );
      await pool.query(
        'INSERT INTO user_modules (user_id, module_id, experience, unlocked) VALUES (?, ?, ?, ?)',
        [userId, 'wood', 0, true],
      );
      await pool.query(
        'INSERT INTO user_modules (user_id, module_id, experience, unlocked) VALUES (?, ?, ?, ?)',
        [userId, 'harvest', 0, true],
      );

      // 初始化所有单位（从unit_definitions表获取）
      const [unitDefs] = await pool.query(
        'SELECT module_id, unit_id FROM unit_definitions',
      );

      for (const unitDef of unitDefs) {
        const { module_id, unit_id } = unitDef;
        const isDefaultUnit =
          (module_id === 'cow' && unit_id === 'normalCow') ||
          (module_id === 'harvest' && unit_id === 'spaceBerry') ||
          (module_id === 'wood' && unit_id === 'normalTree');

        await pool.query(
          'INSERT INTO user_units (user_id, module_id, unit_id, owned, unlocked, produced) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, module_id, unit_id, isDefaultUnit ? 1 : 0, isDefaultUnit, 0],
        );
      }

      console.log(`用户 ${userId} 状态初始化完成`);
    }
  } catch (error) {
    console.error('初始化用户状态错误:', error);
  }
}

// 获取所有单位定义
async function getAllUnitDefinitions() {
  try {
    console.log('执行数据库查询获取单位定义...');
    const [rows] = await pool.query(
      'SELECT * FROM unit_definitions ORDER BY module_id, required_level',
    );
    console.log('数据库查询结果行数:', rows.length);

    const result = rows.map((unit) => ({
      moduleId: unit.module_id,
      unitId: unit.unit_id,
      name: unit.name,
      baseProduction: unit.base_production,
      actionTime: unit.action_time,
      requiredLevel: unit.required_level,
      score: unit.score,
      description: unit.description,
    }));

    // console.log('处理后的单位定义:', result);
    console.log('处理后的单位定义:', result.length);
    return result;
  } catch (error) {
    console.error('获取所有单位定义错误:', error);
    return [];
  }
}

// 处理获取单位定义
async function handleFetchUnitDefinitions(ws) {
  try {
    console.log('开始获取单位定义...');
    const unitDefinitions = await getAllUnitDefinitions();
    console.log('获取到单位定义数量:', unitDefinitions.length);
    // console.log('单位定义数据:', unitDefinitions);

    ws.send(
      JSON.stringify({
        type: 'unit_definitions',
        data: unitDefinitions,
      }),
    );
    console.log('单位定义数据已发送到客户端');
  } catch (error) {
    console.error('获取单位定义错误:', error);
  }
}

// 同步经验值
async function syncExperience(userId, units, unitDefinitions) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(
        `开始同步用户 ${userId} 的经验值 (尝试 ${
          retryCount + 1
        }/${maxRetries})`,
      );

      // 使用事务确保原子性
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // 按模块分组计算经验值
        const moduleExperience = {};

        for (const unitKey in units) {
          const unit = units[unitKey];
          const [moduleId, unitId] = unitKey.split('.');
          const unitDef = unitDefinitions?.find(
            (def) => def.moduleId === moduleId && def.unitId === unitId,
          );

          if (
            unitDef &&
            typeof unit.owned === 'number' &&
            typeof unitDef.score === 'number'
          ) {
            const experience = unit.owned * unitDef.score;
            moduleExperience[moduleId] =
              (moduleExperience[moduleId] || 0) + experience;
            // console.log(
            //   `模块 ${moduleId} 单位 ${unitId}: 拥有 ${unit.owned}, 分数 ${unitDef.score}, 经验 ${experience}`,
            // );
          }
        }

        // 更新每个模块的经验值
        for (const moduleId in moduleExperience) {
          const totalExperience = moduleExperience[moduleId];
          console.log(`更新模块 ${moduleId} 经验值为: ${totalExperience}`);

          // 检查模块是否存在，不存在则创建
          const [existingModule] = await connection.query(
            'SELECT * FROM user_modules WHERE user_id = ? AND module_id = ?',
            [userId, moduleId],
          );

          if (existingModule.length === 0) {
            // 创建新模块记录
            await connection.query(
              'INSERT INTO user_modules (user_id, module_id, experience) VALUES (?, ?, ?)',
              [userId, moduleId, totalExperience],
            );
            console.log(
              `创建模块 ${moduleId} 记录，经验值: ${totalExperience}`,
            );
          } else {
            // 更新现有模块记录
            await connection.query(
              'UPDATE user_modules SET experience = ? WHERE user_id = ? AND module_id = ?',
              [totalExperience, userId, moduleId],
            );
            console.log(`更新模块 ${moduleId} 经验值为: ${totalExperience}`);
          }
        }

        await connection.commit();
        console.log(`用户 ${userId} 经验值同步完成`);

        // 移除自动发送用户状态，避免循环调用
        return; // 成功完成，退出重试循环
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      retryCount++;
      console.error(
        `同步经验值错误 (尝试 ${retryCount}/${maxRetries}):`,
        error,
      );

      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries) {
        // 锁等待超时，等待一段时间后重试
        const waitTime = Math.min(1000 * retryCount, 3000); // 递增等待时间，最大3秒
        console.log(`锁等待超时，等待 ${waitTime}ms 后重试...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // 其他错误或已达到最大重试次数
      console.error('同步经验值最终失败:', error);
      break;
    }
  }
}

async function addUserUnitProduction(
  userId,
  moduleId,
  unitId,
  productionAmount,
) {
  try {
    // 使用事务确保原子性
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 先获取当前单位状态
      const [currentUnit] = await connection.query(
        'SELECT owned, produced FROM user_units WHERE user_id = ? AND module_id = ? AND unit_id = ?',
        [userId, moduleId, unitId],
      );

      let newOwned, newProduced;
      if (currentUnit.length === 0) {
        // 用户还没有该单位记录，创建新记录
        newOwned = productionAmount;
        newProduced = productionAmount;
        await connection.query(
          'INSERT INTO user_units (user_id, module_id, unit_id, owned, produced, unlocked) VALUES (?, ?, ?, ?, ?, TRUE)',
          [userId, moduleId, unitId, newOwned, newProduced],
        );
      } else {
        // 用户已有该单位记录，原子性累加
        newOwned = currentUnit[0].owned + productionAmount;
        newProduced = currentUnit[0].produced + productionAmount;
        await connection.query(
          'UPDATE user_units SET owned = ?, produced = ? WHERE user_id = ? AND module_id = ? AND unit_id = ?',
          [newOwned, newProduced, userId, moduleId, unitId],
        );
      }

      await connection.commit();
      console.log(
        `用户 ${userId} 单位 ${moduleId}.${unitId} 生产数量增加 ${productionAmount}，新拥有: ${newOwned}，新生产: ${newProduced}`,
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('增加单位生产数量错误:', error);
  }
}
