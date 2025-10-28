import { Request, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

// 创建异步本地存储实例
const asyncLocalStorage = new AsyncLocalStorage<Request>();

// 用于存储打印数据的符号键
const PRINT_DATA_KEY = Symbol('printData');

// 序列化打印数据
function serializePrintData(...data: any[]): string {
  try {
    return data.map(item => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item !== null) {
        return JSON.stringify(item, null, 2);
      } else {
        return String(item);
      }
    }).join(' ');
  } catch (error) {
    return data.map(item => String(item)).join(' ');
  }
}

// 获取当前请求的打印数据
export function getPrintData(req: any): string[] {
  if (!req[PRINT_DATA_KEY]) {
    req[PRINT_DATA_KEY] = [];
  }
  return req[PRINT_DATA_KEY];
}

// 清空打印数据
export function clearPrintData(req: any): void {
  req[PRINT_DATA_KEY] = [];
}

// 获取所有打印数据的字符串形式
export function getAllPrintData(req: Request):Record<number, string> {
  const printDataArray = getPrintData(req);
  return printDataArray.reduce((acc, item, index) => ({ ...acc, [index]: item }), {});
}

// 全局 print 方法
export function print(...data: any[]): void {
  try {
    // 从异步本地存储中获取当前请求对象
    const req = asyncLocalStorage.getStore();

    if (req) {
      const serializedData = serializePrintData(...data);
      const printDataArray = getPrintData(req);
      printDataArray.push(serializedData);
    }
  } catch (error) {
    // 出错时回退到控制台输出
    // console.log(...data);
  }finally {
    console.log(...data)
  }
}

// 在异步上下文中运行函数
export function runWithRequestContext<T>(req: Request, res: Response, fn: () => T): T {
  return asyncLocalStorage.run(req, fn);
}
