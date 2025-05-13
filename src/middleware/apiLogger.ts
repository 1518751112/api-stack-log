import {NextFunction, Request, Response} from 'express';
import ApiLog from '../db/ApiLog';
import {v4 as uuidv4} from 'uuid';
import cleanStack from '../clean-stack';
import {ApiLoggerOptions} from "../../index";

const diyKey = {
    requestId: '__requestId',
    stackTrace: '__stackTrace'
}

/**
 * 序列化数据并在必要时截断
 * @param data 要序列化的数据
 * @param maxLength 最大长度，超过则截断，默认为10000
 * @returns 序列化后的字符串
 */
function serializeAndTruncate(data: any, maxLength: number = 10000): string | null {
  if (data === undefined || data === null) {
    return null;
  }

  try {
    // 序列化数据
    let serialized: string|null;

    // 处理不同类型的数据
    if (typeof data === 'object') {
      // 判断是否为 FormData 或类似的特殊对象
      if ((data.constructor && data.constructor.name === 'FormData') ||
          (data.getHeaders && typeof data.getHeaders === 'function') ||
          (data.getBoundary && typeof data.getBoundary === 'function')) {
        // 尝试提取表单数据的信息（不同的中间件处理方式可能不同）
        const formInfo = {
          type: 'form-data',
          fields: Object.keys(data).map(key => ({ key }))
        };
        serialized = JSON.stringify(formInfo);
      }
      // 处理文件上传的情况
      else if (data.buffer || data.path || data.mimetype ||
               (data.file && (data.file.buffer || data.file.path))) {
        // 对于文件上传，只记录文件信息而不是文件内容
        const fileInfo = {
          type: 'file',
          filename: data.originalname || data.filename || 'unknown',
          mimetype: data.mimetype || 'unknown',
          size: (data.size || data.buffer?.length || 0) + ' bytes'
        };
        serialized = JSON.stringify(fileInfo);
      }
      // 处理常规对象
      else {
        serialized = Object.keys(data).length ? JSON.stringify(data) : null;
      }
    } else if (Buffer.isBuffer(data)) {
      // 对于二进制数据，转换为字符串
      serialized = `<Binary data: ${data.length} bytes>`;
      // 如果需要查看部分内容，可以添加预览
      if (data.length > 0 && data.length <= 100) {
        try {
          serialized += ' Preview: ' + data.toString('utf8');
        } catch (e) {
          // 忽略转换错误
        }
      }
    } else {
      serialized = String(data);
    }

    // 如果数据为空，返回null
    if (!serialized) {
      return null;
    }

    // 如果超过最大长度，进行截断
    /*if (serialized.length > maxLength) {
      return serialized.substring(0, maxLength) + '... [截断]';
    }*/

    return serialized;
  } catch (e) {
    console.log(e)
    return '[无法序列化的数据]';
  }
}

/**
 * 判断请求路径是否在白名单中
 * @param path 请求路径
 * @param whitelist 白名单路径数组
 * @returns 是否在白名单中
 */
function isPathWhitelisted(path: string, whitelist: (string | RegExp)[]): boolean {
  if (!whitelist || whitelist.length === 0) {
    return false;
  }

  return whitelist.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(path);
    }

    // 字符串精确匹配或前缀匹配
    return path === pattern ||
           (pattern.endsWith('*') && path.startsWith(pattern.slice(0, -1)));
  });
}

//过滤掉不必要的堆栈信息
const pathFilter = (path:string) => !/node_modules/.test(path);

/**
 * 记录API请求的中间件
 */
export default function apiLoggerMiddleware(options: ApiLoggerOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 检查请求路径是否在白名单中
    const path = req.path;

    // 判断路径是否匹配白名单
    const isWhitelisted = isPathWhitelisted(path, options.whitelistPaths || []);

    // 判断是否系统API路径
    const isSystemApi = options.excludeSystemApis &&
                         path.startsWith(options.routePrefix || '/api-logs');

    // 如果在白名单中或是系统API，则不记录日志
    if (isWhitelisted || isSystemApi) {
      return next();
    }
    //过滤请求方法
    if (options.filterRequestMethods && options.filterRequestMethods.length > 0) {
      const method = req.method.toUpperCase();
      if (options.filterRequestMethods.includes(method)) {
        return next();
      }
    }

    // 记录请求开始时间
    const startTime = process.hrtime();

    // 请求信息（初始信息）
    let requestInfo: any = {
      // 生成请求ID
      id: uuidv4(),
      method: req.method,
      path: req.path,
      ip: (req.headers['x-real-ip'] as string) || (req.headers['http_x_forwarded_for'] as string) || (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress as string) || req.ip || '',
      headers: serializeAndTruncate(req.headers),
      query: serializeAndTruncate(req.query),
      params: serializeAndTruncate(req.params),
      // 暂时不设置 requestBody，将在请求结束时捕获，确保内容完整
      stack: null
    };
    requestInfo.ip = requestInfo.ip.replace(/::ffff:/, ''); // 处理IPv6格式的IPv4地址

    // 存储响应数据
    const responseInfo:any = {
        status: 200,
        responseBody: null,
    }

    // 捕获原始的响应方法
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;    // 重写send方法以捕获响应
    const reqAny = req as any;

    res.send = function(body): Response {
      // 保存响应数据，但不立即记录日志
      if (options.logRequestResponse && body) {
        responseInfo.responseBody = serializeAndTruncate(body);
      }

      // 保存状态码
      responseInfo.status = res.statusCode;

      return originalSend.apply(res, arguments as any);
    };    // 重写json方法以捕获响应
    res.json = function(body): Response {
      // 保存响应数据，但不立即记录日志
      if (options.logRequestResponse && body) {
        responseInfo.responseBody = serializeAndTruncate(body);
      }

      // 保存状态码
      responseInfo.status = res.statusCode;
      return originalJson.apply(res, arguments as any);
    };    // 重写end方法以捕获响应
    res.end = function(chunk): Response {
      // 如果是通过end方法发送数据并且尚未捕获到响应数据
      if (options.logRequestResponse && chunk && !responseInfo.responseBody) {
        responseInfo.responseBody = serializeAndTruncate(chunk);
      }

      // 保存状态码
      responseInfo.status = res.statusCode;
      if(reqAny[diyKey.requestId]){
        requestInfo.id = reqAny[diyKey.requestId]
      }
      // 如果配置了在响应头中包含ID，则添加
      if (options.includeIdInHeader) {
        const headerName = options.requestIdHeaderName || 'X-Request-Id';
        res.setHeader(headerName, requestInfo.id);
      }
      // 执行原始的end方法
      const result = originalEnd.apply(res, arguments as any);

      // 请求结束后记录完整日志
      recordCompleteLog().catch((error) => {
        console.error('API Logger: 记录请求日志失败', error);
      });

      return result;
    };
    // 完整日志记录函数，只在请求结束后调用一次
    async function recordCompleteLog() {
      // 计算响应时间（毫秒）
      const hrTime = process.hrtime(startTime);
      const responseTime = hrTime[0] * 1000 + hrTime[1] / 1000000;

      // 重试机制，处理可能的 ID 冲突问题
      let retries = 3;

      // 使用 Promise 而不是立即执行，以便更好地控制异步流程      const logPromise = async () => {
        if (options.logRequestResponse && req.body) {
          requestInfo.requestBody = serializeAndTruncate(req.body);
        }
      if(options.logStackTrace && reqAny[diyKey.stackTrace]) {
        requestInfo.stack = JSON.stringify(cleanStack(reqAny[diyKey.stackTrace],{pathFilter,pretty:true,basePath:options.filterStackBasePath||undefined})?.split('\n'))
      }
        while (retries > 0) {
          try {
            // 每次尝试都生成新的 UUID，避免 ID 冲突
            const logData = {
              ...requestInfo,
              id: retries === 3 ? requestInfo.id : uuidv4(), // 首次尝试使用原始 ID，重试时生成新 ID
              status: responseInfo.status,
              responseTime,
              responseBody: responseInfo.responseBody
            };

            // 创建日志记录
            await ApiLog.create(logData);
            // console.log(`API Logger: 请求日志已记录 [${logData.method}] ${logData.path}`);
            break; // 成功创建日志后跳出循环
          } catch (error:any) {
            retries--;

            // 检查是否是 ID 冲突错误
            if (error.name === 'SequelizeUniqueConstraintError' && retries > 0) {
              console.warn('API Logger: ID 冲突，重新尝试创建日志...');
              continue; // 继续重试
            }

            // 最后一次尝试失败或其他错误
            if (retries === 0) {
              console.error('API Logger: 记录请求日志失败', error);
            }
          }
        }
      }


    next();
  };
}
