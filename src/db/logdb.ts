import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import path from 'path';
import fs from 'fs';

let sequelize: Sequelize;
/**
 * 初始化数据库连接
 * @param dbPath 可选的数据库文件路径
 * @returns Sequelize 实例
 */
export function initDatabase(dbPath?: string): Sequelize {
    // 如果已经初始化过，则直接返回
    if (sequelize) {
        return sequelize;
    }
  // 默认数据库路径
  const defaultDbDir = path.join(process.cwd(), 'data');
  const defaultDbPath = path.join(defaultDbDir, 'api_logs.sqlite');

  // 使用提供的路径或默认路径
  const finalDbPath = dbPath || defaultDbPath;

  // 确保数据库目录存在
  const dbDir = path.dirname(finalDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  console.log(`API Logger: 数据库文件将存储在 ${finalDbPath}`);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: finalDbPath,
    logging: false,
  });
  // 创建 SQLite 数据库连接
  return sequelize
}
export {
  sequelize
}
