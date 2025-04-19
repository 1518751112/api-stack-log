import ApiLog from '../db/ApiLog';
import { v4 as uuidv4 } from 'uuid';

/**
 * 记录API日志的接口
 */
export interface LogEntry {
  /**
   * 自定义ID，如不提供则自动生成
   */
  id?: string;
  
  /**
   * 请求方法，例如 GET, POST, PUT, DELETE 等
   */
  method: string;
  
  /**
   * 请求路径
   */
  path: string;
  
  /**
   * 状态码
   */
  status: number;
  
  /**
   * 响应时间（毫秒）
   */
  responseTime?: number;
  
  /**
   * 客户端IP地址
   */
  ip?: string;
  
  /**
   * 用户代理信息
   */
  userAgent?: string;
  
  /**
   * 请求体
   */
  requestBody?: any;
  
  /**
   * 响应体
   */
  responseBody?: any;
  
  /**
   * 请求参数（查询字符串）
   */
  query?: any;
  
  /**
   * 路径参数
   */
  params?: any;
  
  /**
   * 错误栈，通常是在请求处理过程中遇到错误时记录
   */
  stack?: string;
}

/**
 * 手动记录API日志的函数
 * 可以在应用的任何地方调用此函数来记录日志
 * 
 * @param entry 日志条目数据
 * @returns Promise<ApiLog> 创建的日志记录
 */
export async function logApiRequest(entry: LogEntry): Promise<any> {
  try {
    // 准备日志数据
    const logData: any = {
      id: entry.id || uuidv4(),
      method: entry.method,
      path: entry.path,
      status: entry.status,
      responseTime: entry.responseTime || 0,
      ip: entry.ip || '未知',
      userAgent: entry.userAgent || '未知',
      timestamp: new Date()
    };
    
    // 处理可选字段
    if (entry.requestBody) {
      logData.requestBody = typeof entry.requestBody === 'object' 
        ? JSON.stringify(entry.requestBody) 
        : String(entry.requestBody);
    }
    
    if (entry.responseBody) {
      logData.responseBody = typeof entry.responseBody === 'object' 
        ? JSON.stringify(entry.responseBody) 
        : String(entry.responseBody);
    }
    
    if (entry.query) {
      logData.query = typeof entry.query === 'object' 
        ? JSON.stringify(entry.query) 
        : String(entry.query);
    }
    
    if (entry.params) {
      logData.params = typeof entry.params === 'object' 
        ? JSON.stringify(entry.params) 
        : String(entry.params);
    }
    
    if (entry.stack) {
      logData.stack = entry.stack;
    }
    
    // 创建日志记录
    return await ApiLog.create(logData);
  } catch (error) {
    console.error('Failed to manually log API request:', error);
    throw error;
  }
}
