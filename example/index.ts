import express from 'express';
import initApiLogger, { print } from '../index';
import {join} from "path";

const app = express();

async function start(){
    await initApiLogger(app, {
        routePrefix: '/api-logs',
        dbPath: join(__dirname,'doc/logs.sqlite'),
        whitelistPaths:[/^\/doc/,'/favicon.ico',/^\/.well-known/],
        logStackTrace:true,
        includeIdInHeader:true,
        maxDays:10, // 设置日志最大保存天数为10天
        cleanupInterval: 60, // 设置日志清理检测间隔为60分钟
        cors:true, // 允许跨域
        auth:{
            password: '123',
            secret:"122dfg%f"
        },
        title:"API 日志系统"
    });
    // 示例路由
    app.get('/api', (req, res) => {
        // 使用 print 方法记录调试信息
        print('API 请求开始处理');
        print('请求方法:', req.method);
        print('请求路径:', req.path);
        
        // 自动追踪的 Express 中间件会记录此路由
        res.json({ message: 'Hello from OpenTelemetry!' });
    });

// 带子路由的示例
    app.get('/api/user/:id', (req, res) => {
        const userId = req.params.id;
        
        // 使用 print 记录用户查询
        print('开始查询用户信息');
        print('用户ID:', userId);
        print('查询参数:', req.query);

        // 模拟业务逻辑
        setTimeout(() => {
            // 在异步回调中也可以使用 print
            print('用户查询完成');
            print('返回用户数据:', { userId, name: 'John Doe' });
            
            res.json({ userId, name: 'John Doe' });
        }, 100);
    });

    // 启动服务
    const PORT = 3000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`[api_log_UI]`, `http://127.0.0.1:3000/api-logs/ui/#`)
    });
}
start()
