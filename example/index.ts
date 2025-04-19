import express  from 'express';
import initApiLogger  from '../index';
import {join} from "path";
const app = express();

async function start(){
    await initApiLogger(app, {
        routePrefix: '/api-logs',
        dbPath: join(__dirname,'doc/logs.sqlite'),
        whitelistPaths:[/^\/doc/],
        logStackTrace:true,
        includeIdInHeader:true,
        maxDays:10, // 设置日志最大保存天数为10天
        cleanupInterval: 60, // 设置日志清理检测间隔为60分钟
    });
    // 示例路由
    app.get('/api', (req, res) => {
        // 自动追踪的 Express 中间件会记录此路由
        res.json({ message: 'Hello from OpenTelemetry!' });
    });

// 带子路由的示例
    app.get('/api/user/:id', (req, res) => {
        const userId = req.params.id;

        // 模拟业务逻辑
        setTimeout(() => {
            res.json({ userId, name: 'John Doe' });
        }, 100);
    });

    // 启动服务
    const PORT = 3000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
start()
