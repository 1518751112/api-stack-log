# API Stack Log [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> 一个强大的 API 日志记录、查询和可视化系统，适用于 Express/NestJS 应用

API Stack Log 为你的应用提供全面的 API 请求日志记录功能，包括请求/响应详情、执行时间、调用栈等，并提供美观的 UI 界面进行查询、筛选和分析。

## 特性

- 自动记录 API 请求和响应详情✅
- 支持请求 ID 追踪✅
- 记录调用栈信息（可选）✅
- 提供美观的 UI 界面查看日志✅
- 强大的筛选和搜索功能✅
- 支持按条数或天数自动清理日志✅
- 支持通过 URL 直接访问日志详情✅
- 详细的日志统计信息❌ 有统计接口但是UI还没做

## 安装

```bash
npm install api-stack-log --save
```

## 基本用法

```typescript
import express from 'express';
import initApiLogger from 'api-stack-log';

const app = express();

// 在所有路由之前初始化 API 日志系统
await initApiLogger(app);

// 你的其他路由和中间件...
app.get('/api/example', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

初始化成功后，你可以通过访问 `http://localhost:3000/api-logs/ui` 来查看 API 日志界面。

## 配置选项

API Stack Log 提供多种配置选项，可以根据你的需求进行自定义：

```typescript
await initApiLogger(app, {
  routePrefix: '/api-logs',       // API 日志查询路由的路径前缀
  uiService: '',                  // UI 使用的服务端地址，默认使用相对路径
  syncDatabase: true,             // 是否自动同步数据库模型
  enabled: true,                  // 是否启用日志记录
  dbPath: './logs.sqlite',        // SQLite 数据库文件的自定义路径
  includeIdInHeader: true,        // 是否在响应头上添加请求 ID
  requestIdHeaderName: 'X-Request-Id', // 响应头中的 ID 字段名称
  logRequestResponse: true,       // 是否记录请求和响应体
  logStackTrace: false,           // 是否记录 API 调用栈信息
  filterStackBasePath: '/path/to/app', // 从堆栈路径中过滤的基路径
  whitelistPaths: ['/health', /^\/public\//], // API 白名单
  excludeSystemApis: true,        // 是否将 API 记录系统自身的路径加入白名单
  maxRecords: 10000,              // 日志最大保存条数，超出删除最旧的 10%
  maxDays: 30,                    // 日志最大保存天数
  cleanupInterval: 60             // 日志清理检测间隔（分钟）
});
```

### 配置选项详细说明

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| routePrefix | string | '/api-logs' | API 日志查询路由的路径前缀 |
| uiService | string | '' | UI 使用的服务端地址，默认使用相对路径 |
| syncDatabase | boolean | true | 是否自动同步数据库模型 |
| enabled | boolean | true | 是否启用日志记录 |
| dbPath | string | undefined | SQLite 数据库文件的自定义路径 |
| includeIdInHeader | boolean | false | 是否在响应头上添加请求 ID |
| requestIdHeaderName | string | 'X-Request-Id' | 响应头中的 ID 字段名称 |
| logRequestResponse | boolean | true | 是否记录请求和响应体 |
| logStackTrace | boolean | false | 是否记录 API 调用栈信息 |
| filterStackBasePath | string | undefined | 从堆栈路径中过滤的基路径 |
| whitelistPaths | (string \| RegExp)[] | [] | API 白名单，这些路径的请求将不会被记录 |
| excludeSystemApis | boolean | true | 是否将 API 记录系统自身的路径加入白名单 |
| maxRecords | number | 0 | 日志最大保存条数，超出删除最旧的 10%（0 为不限制） |
| maxDays | number | 0 | 日志最大保存天数（0 为不限制） |
| cleanupInterval | number | 60 | 日志清理检测间隔（分钟） |

## 高级用法

### 自定义请求 ID

你可以在请求对象中添加 `__requestId` 属性来设置自定义的请求 ID：

```typescript
app.use((req, res, next) => {
  req.__requestId = 'custom-id-' + Date.now();
  next();
});
```

### 记录调用栈

启用调用栈记录后，你可以在请求对象中添加 `__stackTrace` 属性：

```typescript
await initApiLogger(app, { logStackTrace: true });

app.use((req, res, next) => {
  try {
    throw new Error('Capture stack trace');
  } catch (error) {
    req.__stackTrace = error.stack;
  }
  next();
});
```

### NestJS 集成

在 NestJS 应用中，你可以创建一个模块来集成 API 日志系统：

```typescript
// api-logger.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import initApiLogger from 'api-stack-log';

@Module({})
export class ApiLoggerModule implements OnModuleInit {
  constructor(private readonly app: INestApplication) {}

  async onModuleInit() {
    await initApiLogger(this.app.getHttpAdapter().getInstance());
  }
}
```

## API 说明

API Stack Log 提供以下 API 接口：

### 日志列表查询

```
GET /api-logs
```

支持的查询参数：
- `page`: 页码（默认 1）
- `limit`: 每页条数（默认 20）
- `id`: 日志 ID
- `method`: 请求方法
- `path`: 请求路径（支持模糊查询）
- `status`: 状态码
- `ip`: IP 地址（支持模糊查询）
- `stack`: 栈信息（支持模糊查询）
- `headers`: 请求头（支持模糊查询）
- `requestBody`: 请求内容（支持模糊查询）
- `responseBody`: 响应内容（支持模糊查询）
- `startDate`: 开始日期
- `endDate`: 结束日期

### 日志详情查询

```
GET /api-logs/info/:id
```

### 日志统计信息

```
GET /api-logs/stats/summary
```

返回的统计信息包括：
- 总请求数
- 状态码分布
- 方法分布

## UI 界面

API Stack Log 提供了美观的 UI 界面，用于查看和分析日志数据。UI 界面支持以下功能：
UI部分功能开发中

- 日志列表和详情页面，支持通过 hash 路由切换（如 #logs、#log/xxxx）❌
- 支持多种条件的筛选和搜索✅
- 日志详情页支持 ID 一键复制，并有复制成功提示✅
- JSON 数据高亮显示✅
- 支持日志对比功能❌
- 支持左右分栏或单页显示切换❌
