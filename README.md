# API Stack Log [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

<div align="center">中文 | <a href="./README_en.md">English</a></div>

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
- 支持通过日志重发✅
- 访问UI文档鉴权 保护日志数据的安全性✅
- 调试打印功能，支持异步上下文追踪✅
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
await initApiLogger(app,{
    cors:true,
    auth:{
      password: '123',
       exp:360000, // 令牌过期时间（秒）
      secret:"122dfg%f"
   }});

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
  cleanupInterval: 60,             // 日志清理检测间隔（分钟）
  filterRequestMethods: ["OPTIONS"],             // 过滤请求类型
  cors: true            // 允许所有跨域请求
   
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
| filterRequestMethods | string[]             | []  | 过滤请求类型
| cors | boolean \| CorsOptions \| CorsOptionsDelegate<any>  | null  | 跨域配置

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

### 调试打印功能

API Stack Log 提供了 `print` 方法，允许你在请求处理过程中记录调试信息，这些信息会自动关联到对应的 API 日志中：

```typescript
import { print } from 'api-stack-log';

app.get('/api/users', async (req, res) => {
  print('开始处理用户查询请求');
  
  const userId = req.query.id;
  print('用户ID:', userId);
  
  // 异步操作中也可以使用
  setTimeout(() => {
    print('异步操作中的调试信息');
  }, 100);
  
  const userData = await getUserData(userId);
  print('获取到用户数据:', userData);
  
  res.json(userData);
});
```

`print` 方法的特点：
- 自动关联到当前请求的日志记录中
- 支持在异步操作中使用（基于 Node.js AsyncLocalStorage）
- 支持多种数据类型的序列化
- 调试信息会显示在日志详情的 `printData` 字段中

### NestJS 集成

在 NestJS 应用中，你可以创建一个模块来集成 API 日志系统：

```typescript
// main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { join } from 'path'
import initApiLogger from 'api-stack-log';

async function bootstrap() {
   const app = await NestFactory.create(AppModule, { cors: true })

   const expressApp = app.getHttpAdapter().getInstance();

   const port = 8000;
   const config = {
      routePrefix: '/api-logs',
      dbPath: join(__dirname,'doc/logs.sqlite'),
      whitelistPaths:[/^\/doc/],
      logStackTrace:true,
      includeIdInHeader:true,
      maxDays:10,
      cleanupInterval: 60,
      cors:true
   }
   // Initialize the API logging system before all routes
   await initApiLogger(expressApp, config);

   setTimeout(()=>{
      console.log(`[api_log_UI]`, `http://127.0.0.1:${port}${config.routePrefix}/ui/#`)
   },300)

   await app.listen(port)
}
bootstrap()

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

- 日志列表和详情页面，支持通过 hash 路由切换✅
- - 双列模式：#
- - 单列模式：#list
- - 详情：#info?id=xxxx
- 支持多种条件的筛选和搜索✅
- 日志详情页支持 ID 一键复制，并有复制成功提示✅
- JSON 数据高亮显示✅
- 支持日志对比功能❌
- 支持左右分栏或单页显示切换✅

## 界面截图
<img alt="双列模式" src="https://github.com/1518751112/api-stack-log/raw/HEAD/image/1.png" onerror="this.onerror=null; this.src='./image/1.png';" style="max-width: 100%;"/>
<img alt="单列模式" height="500" src="https://github.com/1518751112/api-stack-log/raw/HEAD/image/3.png" onerror="this.onerror=null; this.src='./image/3.png';" style="max-width: 100%;"/>
<img alt="信息调用栈" height="200" src="https://github.com/1518751112/api-stack-log/raw/HEAD/image/4.png" onerror="this.onerror=null; this.src='./image/4.png';" style="max-width: 100%;"/>
<img alt="日志详情" height="400" src="https://github.com/1518751112/api-stack-log/raw/HEAD/image/2.png" onerror="this.onerror=null; this.src='./image/2.png';" style="max-width: 100%;"/>

## 安装或初始化报错
1.在 CentOS 系统中遇到 `/lib64/libstdc++.so.6: version 'CXXABI_1.3.8' not found` 错误，通常是因为 **系统自带的 `libstdc++.so.6` 版本过低**，无法满足某些依赖库（如 `sqlite3`）对 C++ ABI 的要求。以下是详细解决方案：
备选方案：手动更新【这个操作简单也快】

---

### **1. 确认问题根源**
#### 检查当前 `libstdc++.so.6` 支持的 CXXABI 版本：
```bash
# 查看当前 libstdc++.so.6 支持的 CXXABI 版本
strings /usr/lib64/libstdc++.so.6 | grep 'CXXABI_'

# 如果输出中没有 CXXABI_1.3.8，说明版本过低
```

---

### **2. 安装高版本 GCC 工具链**
CentOS 默认的 GCC 版本较旧（如 4.8.5），需通过 `devtoolset` 安装新版 GCC。

#### 2.1 启用 SCL 仓库并安装 devtoolset-7：
```bash
sudo yum install centos-release-scl
sudo yum install devtoolset-7
```

#### 2.2 激活 devtoolset-7 环境：
```bash
# 临时激活（仅在当前终端生效）
scl enable devtoolset-7 bash

# 验证 GCC 版本
gcc --version  # 应显示 gcc 7.x.x
```

#### 2.3 永久激活（可选）：
将以下内容添加到 `~/.bashrc` 或 `~/.bash_profile`：
```bash
source /opt/rh/devtoolset-7/enable
export LD_LIBRARY_PATH=/opt/rh/devtoolset-7/root/usr/lib64:$LD_LIBRARY_PATH
```

---

### **3. 重新编译 SQLite3 模块**
在激活的高版本 GCC 环境下重新编译 `sqlite3` 模块：

#### 3.1 清理旧编译文件：
```bash
cd /path/to/your/project
rm -rf node_modules
```

#### 3.2 指定使用 devtoolset-7 的编译环境：
```bash
# 强制从源码重新编译，并确保使用新工具链
npm install sqlite3 --build-from-source --verbose
```

---

### **4. 验证 `libstdc++.so.6` 版本**
重新编译后，确认链接的库版本已更新：
```bash
# 查看 sqlite3.node 依赖的库
ldd node_modules/sqlite3/build/Release/node_sqlite3.node | grep libstdc++

# 输出应包含 devtoolset-7 的路径，例如：
# libstdc++.so.6 => /opt/rh/devtoolset-7/root/usr/lib64/libstdc++.so.6
```

---

### **5. 修复运行时库路径**
确保应用程序运行时加载新版本的 `libstdc++.so.6`：

#### 5.1 临时设置环境变量：
```bash
export LD_LIBRARY_PATH=/opt/rh/devtoolset-7/root/usr/lib64:$LD_LIBRARY_PATH
node your_app.js
```

#### 5.2 永久生效（推荐）：
在启动脚本或 `~/.bashrc` 中添加：
```bash
echo 'export LD_LIBRARY_PATH=/opt/rh/devtoolset-7/root/usr/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

---

### **6. 备选方案：手动更新 libstdc++.so.6**
如果无法使用 devtoolset，可手动替换库文件（**风险较高，谨慎操作**）：

#### 6.1 下载高版本 `libstdc++.so.6`：
```bash
# 从高版本 GCC 系统中复制 libstdc++.so.6.0.24 或更高版本
wget http://ftp.de.debian.org/debian/pool/main/g/gcc-8/libstdc++6_8.3.0-6_amd64.deb
ar x libstdc++6_8.3.0-6_amd64.deb
tar -xvf data.tar.xz
```

#### 6.2 替换系统库：
```bash
sudo cp ./usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.25 /usr/lib64/
sudo ln -sf /usr/lib64/libstdc++.so.6.0.25 /usr/lib64/libstdc++.so.6
```

---

### **7. 验证修复**
运行应用程序或检查符号版本：
```bash
# 检查 CXXABI_1.3.8 是否存在
strings /usr/lib64/libstdc++.so.6 | grep 'CXXABI_'

# 输出应包含 CXXABI_1.3.8
# 重新安装依赖
npm i --force
#安装完成后运行程序

```

---

### **常见问题排查**
1. **编译工具链缺失**  
   确保已安装 `gcc`、`g++`、`make`：
   ```bash
   sudo yum install gcc gcc-c++ make
   ```

2. **Python 版本问题**  
   `node-gyp` 可能需要 Python 2.7：
   ```bash
   sudo yum install python2
   npm config set python python2.7
   ```

3. **权限问题**  
   确保对项目目录有读写权限：
   ```bash
   sudo chown -R $(whoami):$(whoami) /path/to/project
   ```


通过上述步骤升级 GCC 工具链并重新编译，可彻底解决 `CXXABI_1.3.8` 缺失问题。

---
2.GLIBC_2.18缺失导致Node.js报错的问题
---

一键安装脚本
```bash
#!/bin/bash
# 安装编译依赖
yum install -y gcc make wget bison

# 下载glibc-2.18源码并编译
cd /tmp
wget http://ftp.gnu.org/gnu/glibc/glibc-2.18.tar.gz
tar -zxvf glibc-2.18.tar.gz
cd glibc-2.18
mkdir build && cd build
../configure --prefix=/usr --disable-profile --enable-add-ons --with-headers=/usr/include --with-binutils=/usr/bin
make -j$(nproc) && make install

# 验证安装结果
strings /lib64/libc.so.6 | grep GLIBC_2.18
echo "GLIBC_2.18安装完成，请重启服务或系统以确保生效！"
```

