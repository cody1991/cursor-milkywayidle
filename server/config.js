// 环境配置
const NODE_ENV = process.env.NODE_ENV || 'development';

const config = {
  development: {
    port: process.env.PORT || 3001,
    cors: {
      origin: '*',
      credentials: true,
    },
    helmet: {
      contentSecurityPolicy: false,
    },
    logging: {
      level: 'debug',
      showWebSocketMessages: true,
      showActivityLogs: true,
      showDatabaseLogs: true,
    },
    database: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'milkywayidle',
    },
  },
  production: {
    port: process.env.PORT || 3001,
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
      ],
      credentials: true,
    },
    helmet: {
      contentSecurityPolicy: true,
    },
    logging: {
      level: 'error',
      showWebSocketMessages: false,
      showActivityLogs: false,
      showDatabaseLogs: false,
    },
    database: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'milkywayidle',
    },
  },
};

module.exports = {
  NODE_ENV,
  isDevelopment: NODE_ENV === 'development',
  isProduction: NODE_ENV === 'production',
  config: config[NODE_ENV],
};
