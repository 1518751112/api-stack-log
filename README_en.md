# API Stack Log [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

<div align="center"><a href="./README.md">中文</a> | English</div>

> A powerful API logging, querying, and visualization system for Express/NestJS applications

API Stack Log provides comprehensive API request logging functionality for your application, including request/response details, execution time, call stack, and more, along with an elegant UI interface for querying, filtering, and analysis.

## Features

- Automatic recording of API requests and response details✅
- Request ID tracking support✅
- Call stack information recording (optional)✅
- Elegant UI interface for viewing logs✅
- Powerful filtering and search capabilities✅
- Automatic log cleanup by count or days✅
- Support for direct access to log details via URL✅
- Support for request replay through logs✅
- Access UI documentation authorization to protect the security of log data✅
- Detailed log statistics❌ (API available but UI not yet implemented)

## Installation

```bash
npm install api-stack-log --save
```

## Basic Usage

```typescript
import express from 'express';
import initApiLogger from 'api-stack-log';

const app = express();

// Initialize the API logging system before all routes
await initApiLogger(app,{
    cors:true,
    auth:{
        password: '123',
        exp:360000, // Token expiration time in seconds
        secret:"122dfg%f"
    }});

// Your other routes and middleware...
app.get('/api/example', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

After successful initialization, you can access the API log interface at `http://localhost:3000/api-logs/ui`.

## Configuration Options

API Stack Log provides multiple configuration options that can be customized according to your needs:

```typescript
await initApiLogger(app, {
  routePrefix: '/api-logs',       // Path prefix for API log query routes
  uiService: '',                  // Server address used by UI, defaults to relative path
  syncDatabase: true,             // Whether to automatically sync database models
  enabled: true,                  // Whether to enable log recording
  dbPath: './logs.sqlite',        // Custom path for SQLite database file
  includeIdInHeader: true,        // Whether to add request ID in response header
  requestIdHeaderName: 'X-Request-Id', // ID field name in the response header
  logRequestResponse: true,       // Whether to record request and response bodies
  logStackTrace: false,           // Whether to record API call stack information
  filterStackBasePath: '/path/to/app', // Base path to filter from stack traces
  whitelistPaths: ['/health', /^\/public\//], // API whitelist
  excludeSystemApis: true,        // Whether to add the API recording system's own paths to the whitelist
  maxRecords: 10000,              // Maximum number of logs to keep, deletes oldest 10% when exceeded
  maxDays: 30,                    // Maximum days to keep logs
  cleanupInterval: 60,            // Log cleanup check interval (minutes)
  filterRequestMethods: ["OPTIONS"], // Filter request methods
  cors: true                      // Allow all cross-origin requests
});
```

### Detailed Configuration Options

| Option | Type | Default | Description |
|------|------|--------|------|
| routePrefix | string | '/api-logs' | Path prefix for API log query routes |
| uiService | string | '' | Server address used by UI, defaults to relative path |
| syncDatabase | boolean | true | Whether to automatically sync database models |
| enabled | boolean | true | Whether to enable log recording |
| dbPath | string | undefined | Custom path for SQLite database file |
| includeIdInHeader | boolean | false | Whether to add request ID in response header |
| requestIdHeaderName | string | 'X-Request-Id' | ID field name in the response header |
| logRequestResponse | boolean | true | Whether to record request and response bodies |
| logStackTrace | boolean | false | Whether to record API call stack information |
| filterStackBasePath | string | undefined | Base path to filter from stack traces |
| whitelistPaths | (string \| RegExp)[] | [] | API whitelist, requests to these paths will not be recorded |
| excludeSystemApis | boolean | true | Whether to add the API recording system's own paths to the whitelist |
| maxRecords | number | 0 | Maximum number of logs to keep, deletes oldest 10% when exceeded (0 for unlimited) |
| maxDays | number | 0 | Maximum days to keep logs (0 for unlimited) |
| cleanupInterval | number | 60 | Log cleanup check interval (minutes) |
| filterRequestMethods | string[] | [] | Filter request methods |
| cors | boolean \| CorsOptions \| CorsOptionsDelegate<any> | null | CORS configuration |

## Advanced Usage

### Custom Request ID

You can add an `__requestId` property to the request object to set a custom request ID:

```typescript
app.use((req, res, next) => {
  req.__requestId = 'custom-id-' + Date.now();
  next();
});
```

### Recording Call Stack

After enabling call stack recording, you can add an `__stackTrace` property to the request object:

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

### NestJS Integration

In NestJS applications, you can create a module to integrate the API logging system:

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

## API Documentation

API Stack Log provides the following API endpoints:

### Log List Query

```
GET /api-logs
```

Supported query parameters:
- `page`: Page number (default 1)
- `limit`: Records per page (default 20)
- `id`: Log ID
- `method`: Request method
- `path`: Request path (supports fuzzy search)
- `status`: Status code
- `ip`: IP address (supports fuzzy search)
- `stack`: Stack information (supports fuzzy search)
- `headers`: Request headers (supports fuzzy search)
- `requestBody`: Request content (supports fuzzy search)
- `responseBody`: Response content (supports fuzzy search)
- `startDate`: Start date
- `endDate`: End date

### Log Detail Query

```
GET /api-logs/info/:id
```

### Log Statistics

```
GET /api-logs/stats/summary
```

The returned statistics include:
- Total number of requests
- Status code distribution
- Method distribution

## UI Interface

API Stack Log provides an elegant UI interface for viewing and analyzing log data. The UI interface supports the following features:
Some UI features are still under development

- Log list and detail pages, with hash route switching support✅
   - Dual-column mode: #
   - Single-column mode: #list
   - Details: #info?id=xxxx
- Support for filtering and searching by multiple conditions✅
- Log detail page supports one-click ID copying with success notification✅
- JSON data highlighting✅
- Log comparison functionality❌
- Support for left-right split view or single page display switching✅

## Screenshots
<img alt="Dual-column mode" src="https://github.com/1518751112/api-stack-log/raw/HEAD/image/1.png" onerror="this.onerror=null; this.src='./image/1.png';" style="max-width: 100%;"/>
<img alt="Single-column mode" height="500" src="https://github.com/1518751112/api-stack-log/raw/HEAD/image/3.png" onerror="this.onerror=null; this.src='./image/3.png';" style="max-width: 100%;"/>
<img alt="Call stack information" height="200" src="https://github.com/1518751112/api-stack-log/raw/HEAD/image/4.png" onerror="this.onerror=null; this.src='./image/4.png';" style="max-width: 100%;"/>
<img alt="Log details" height="400" src="https://github.com/1518751112/api-stack-log/raw/HEAD/image/2.png" onerror="this.onerror=null; this.src='./image/2.png';" style="max-width: 100%;"/>

## Installation or Initialization Errors
1. If you encounter the error `/lib64/libstdc++.so.6: version 'CXXABI_1.3.8' not found` on CentOS, it's usually because the system's built-in `libstdc++.so.6` version is too low to meet the requirements of some dependencies (such as `sqlite3`) for C++ ABI. Here's a detailed solution:
   Alternative solution: Manual update [This operation is simple and fast]

---

### **1. Confirm the Root Cause**
#### Check the CXXABI versions supported by the current `libstdc++.so.6`:
```bash
# Check the CXXABI versions supported by the current libstdc++.so.6
strings /usr/lib64/libstdc++.so.6 | grep 'CXXABI_'

# If CXXABI_1.3.8 is not in the output, the version is too low
```

---

### **2. Install Higher Version GCC Toolchain**
The default GCC version in CentOS is older (e.g., 4.8.5), you need to install a new version of GCC via `devtoolset`.

#### 2.1 Enable the SCL repository and install devtoolset-7:
```bash
sudo yum install centos-release-scl
sudo yum install devtoolset-7
```

#### 2.2 Activate the devtoolset-7 environment:
```bash
# Temporarily activate (only effective in the current terminal)
scl enable devtoolset-7 bash

# Verify GCC version
gcc --version  # Should display gcc 7.x.x
```

#### 2.3 Permanently activate (optional):
Add the following to `~/.bashrc` or `~/.bash_profile`:
```bash
source /opt/rh/devtoolset-7/enable
export LD_LIBRARY_PATH=/opt/rh/devtoolset-7/root/usr/lib64:$LD_LIBRARY_PATH
```

---

### **3. Recompile the SQLite3 Module**
Recompile the `sqlite3` module under the activated higher version GCC environment:

#### 3.1 Clean old compilation files:
```bash
cd /path/to/your/project
rm -rf node_modules
```

#### 3.2 Specify the compilation environment using devtoolset-7:
```bash
# Force recompilation from source and ensure using the new toolchain
npm install sqlite3 --build-from-source --verbose
```

---

### **4. Verify the `libstdc++.so.6` Version**
After recompilation, confirm that the linked library version has been updated:
```bash
# Check the libraries that sqlite3.node depends on
ldd node_modules/sqlite3/build/Release/node_sqlite3.node | grep libstdc++

# The output should include the devtoolset-7 path, for example:
# libstdc++.so.6 => /opt/rh/devtoolset-7/root/usr/lib64/libstdc++.so.6
```

---

### **5. Fix Runtime Library Path**
Ensure that the application loads the new version of `libstdc++.so.6` at runtime:

#### 5.1 Temporarily set environment variables:
```bash
export LD_LIBRARY_PATH=/opt/rh/devtoolset-7/root/usr/lib64:$LD_LIBRARY_PATH
node your_app.js
```

#### 5.2 Permanent effect (recommended):
Add to startup script or `~/.bashrc`:
```bash
echo 'export LD_LIBRARY_PATH=/opt/rh/devtoolset-7/root/usr/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

---

### **6. Alternative Solution: Manually Update libstdc++.so.6**
If devtoolset cannot be used, you can manually replace the library file (**high risk, proceed with caution**):

#### 6.1 Download a higher version of `libstdc++.so.6`:
```bash
# Copy libstdc++.so.6.0.24 or higher version from a system with a higher GCC version
wget http://ftp.de.debian.org/debian/pool/main/g/gcc-8/libstdc++6_8.3.0-6_amd64.deb
ar x libstdc++6_8.3.0-6_amd64.deb
tar -xvf data.tar.xz
```

#### 6.2 Replace the system library:
```bash
sudo cp ./usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.25 /usr/lib64/
sudo ln -sf /usr/lib64/libstdc++.so.6.0.25 /usr/lib64/libstdc++.so.6
```

---

### **7. Verify the Fix**
Run the application or check the symbol version:
```bash
# Check if CXXABI_1.3.8 exists
strings /usr/lib64/libstdc++.so.6 | grep 'CXXABI_'

# The output should include CXXABI_1.3.8
# Reinstall dependencies
npm i --force
# After installation is complete, run the program
```

---

### **Common Troubleshooting**
1. **Missing Compilation Toolchain**
   Make sure `gcc`, `g++`, `make` are installed:
   ```bash
   sudo yum install gcc gcc-c++ make
   ```

2. **Python Version Issues**
   `node-gyp` may require Python 2.7:
   ```bash
   sudo yum install python2
   npm config set python python2.7
   ```

3. **Permission Issues**
   Ensure you have read/write permissions for the project directory:
   ```bash
   sudo chown -R $(whoami):$(whoami) /path/to/project
   ```

By upgrading the GCC toolchain and recompiling through the above steps, the `CXXABI_1.3.8` missing issue can be thoroughly resolved.

---
2. GLIBC_2.18 Missing Causing Node.js Error
---

One-click installation script
```bash
#!/bin/bash
# Install compilation dependencies
yum install -y gcc make wget bison

# Download and compile glibc-2.18 source code
cd /tmp
wget http://ftp.gnu.org/gnu/glibc/glibc-2.18.tar.gz
tar -zxvf glibc-2.18.tar.gz
cd glibc-2.18
mkdir build && cd build
../configure --prefix=/usr --disable-profile --enable-add-ons --with-headers=/usr/include --with-binutils=/usr/bin
make -j$(nproc) && make install

# Verify installation results
strings /lib64/libc.so.6 | grep GLIBC_2.18
echo "GLIBC_2.18 installation complete, please restart the service or system to ensure it takes effect!"
```
