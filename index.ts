import {Express} from 'express';
import ApiLog, {ApiLogInit} from './src/db/ApiLog';
import apiLoggerMiddleware from './src/middleware/apiLogger';
import logRoutes, {setRoutePrefix} from './src/routes/log';
import {initDatabase} from './src/db/logdb';

/**
 * 日志系统配置接口
 *
 * 可以自己定义请求id，在req中添加一个属性__requestId，后台会自动使用这个值(如果存在重复id则当前id会失效)
 */
export interface ApiLoggerOptions {
  /**
   * API 日志查询路由的路径前缀，默认为 '/api-logs'
   */
  routePrefix?: string;

  /**
   * UI使用的服务端地址默认使用相对路径，可以通过修改这个值来配置不同的API路径
   */
  uiService?: string;

  /**
   * 是否自动同步数据库模型，默认为 true
   */
  syncDatabase?: boolean;

  /**
   * 是否启用日志记录，默认为 true
   */
  enabled?: boolean;

  /**
   * SQLite 数据库文件的自定义路径
   * 如果路径不存在会自动创建相应的目录和文件
   */
  dbPath?: string;

  /**
   * 是否在响应头上添加请求ID，默认为 false
   * 可在request中通过 req.headers['X-Request-Id'] 获取
   */
  includeIdInHeader?: boolean;

  /**
   * 响应头中的ID字段名称，默认为 'X-Request-Id'
   */
  requestIdHeaderName?: string;

  /**
   * 是否记录请求和响应体，默认为 true
   */
  logRequestResponse?: boolean;

  /**
   * 是否记录API调用栈信息，默认为 false
   * 开启后同时需要在req 中添加一个属性__stackTrace
   * 将栈信息传入，后台会自动过滤掉不必要的堆栈信息并保存
   */
  logStackTrace?: boolean;

  /**
   * 从堆栈跟踪文件路径中删除给定的基路径，从而有效地将绝对路径转换为相对路径。
   *
   * `'/Users/sindresorhus/dev/clean-stack/'` as `basePath`:
   *
   * `/Users/sindresorhus/dev/clean-stack/unicorn.js:2:15` → `unicorn.js:2:15`
   *
   * 默认展示全路径
   */
  filterStackBasePath?: string;

  /**
   * API 白名单，这些路径的请求将不会被记录
   * 可以使用字符串数组或正则表达式数组
   */
  whitelistPaths?: (string | RegExp)[];

  /**
   * 是否将API记录系统自身的API路径添加到白名单中，默认为 true
   */
  excludeSystemApis?: boolean;

  /**
   * 日志最大保存条数，超出后自动删除最旧的10%（0为不限制）
   */
  maxRecords?: number;
  /**
   * 日志最大保存天数，超期自动删除（0为不限制）
   */
  maxDays?: number;
  /**
   * 日志清理检测间隔（单位：分钟，默认60分钟）
   */
  cleanupInterval?: number;
}

/**
 * 默认配置选项
 */
const defaultOptions: ApiLoggerOptions = {
  routePrefix: '/api-logs',
  uiService: '',
  syncDatabase: true,
  enabled: true,
  includeIdInHeader: false,
  requestIdHeaderName: 'X-Request-Id',
  logRequestResponse: true,
  logStackTrace: false,
  whitelistPaths: [],
  excludeSystemApis: true,
  maxRecords: 0, // 0为不限制
  maxDays: 0, // 0为不限制
  cleanupInterval: 60, // 单位：分钟
};

/**
 * 初始化 API 日志系统
 * @param app Express 应用实例
 * @param options 配置选项
 */
export async function initApiLogger(app: Express, options: ApiLoggerOptions = {}): Promise<void> {
  // 合并默认选项
  const config = { ...defaultOptions, ...options };

  // 如果启用日志系统
  if (config.enabled) {
    try {
      // 如果提供了自定义数据库路径，则重新初始化数据库连接
      let dbInstance = initDatabase(config.dbPath||'');
      // 重新初始化 ApiLog 模型与新的数据库连接
      ApiLogInit(dbInstance)

      // 同步数据库模型
      if (config.syncDatabase) {
        await dbInstance.sync({alter: true});
        console.log('API Logger: 数据库同步成功');
      }      // 注册日志中间件
      app.use(apiLoggerMiddleware(config));
      console.log('API Logger: 日志中间件已注册');

      // 设置路由前缀
      setRoutePrefix(config.routePrefix as string);

      // 注册日志查询路由
      app.use(config.routePrefix as string, logRoutes);
      console.log(`API Logger: 日志查询接口已注册在 ${config.routePrefix} 路径下`);
      // 启动定时清理任务
      if ((config.maxRecords ?? 0) > 0 || (config.maxDays ?? 0) > 0) {
        const intervalMs = ((config.cleanupInterval ?? 60)) * 60 * 1000;
        setInterval(async () => {
          try {
            // 按最大条数清理
            if ((config.maxRecords ?? 0) > 0) {
              const total = await ApiLog.count();
              if (total > (config.maxRecords ?? 0)) {
                const delCount = Math.ceil((config.maxRecords ?? 0) / 10);
                const oldLogs = await ApiLog.findAll({
                  order: [['timestamp', 'ASC']],
                  limit: delCount
                });
                const ids = oldLogs.map(l => l.id);
                if (ids.length) await ApiLog.destroy({ where: { id: ids } });
                console.log(`[API Logger] 已自动清理最旧日志 ${ids.length} 条`);
              }
            }
            // 按天数清理
            if ((config.maxDays ?? 0) > 0) {
              const expire = new Date(Date.now() - (config.maxDays ?? 0) * 24 * 60 * 60 * 1000);
              const delNum = await ApiLog.destroy({ where: { timestamp: { ['lt']: expire } } });
              if (delNum > 0) console.log(`[API Logger] 已自动清理过期日志 ${delNum} 条`);
            }
          } catch (e) {
            console.error('[API Logger] 日志自动清理异常', e);
          }
        }, intervalMs);
        console.log(`[API Logger] 日志自动清理任务已启动，间隔${config.cleanupInterval||60}分钟`);
      }
    } catch (error) {
      console.error('API Logger: 初始化失败', error);
      throw error;
    }

  }


}

// 导出模型和接口
export { ApiLog };

// 默认导出初始化函数
export default initApiLogger;
