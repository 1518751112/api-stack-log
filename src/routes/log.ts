import express, {Request, Response, Router} from 'express';
import {Op} from 'sequelize';
import ApiLog from '../db/ApiLog';
import path from 'path';
import fs from 'fs';
import {AuthOptions} from "../../index";
import {getIp, jwtEncodeInExpire} from "../utils/crypt.util";

// let routePrefix = '/api-logs'; // 默认路由前缀

const router = Router();

// 设置路由前缀
export function setRoutePrefix(prefix: string, uiService?: string) {
  //动态修改文件配置信息
  //读取文件config-manager.js
    const configPath = path.join(__dirname, './static/js/components/config-manager_base.js');
    const newConfigPath = path.join(__dirname, './static/js/components/config-manager.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    let newContent = configContent.replace(/"path":\s*['"]?[^'"]*['"]?/g, `path: '${prefix.replace(/^\//, '')}'`);
    //替换uiService
    if(uiService!=null){
        newContent = newContent.replace(/"apiBasePath":\s*['"]?[^'"]*['"]?/g, `"apiBasePath": '${uiService}'`);
    }
    //没有当前文件就创建newConfigPath
    fs.writeFileSync(newConfigPath, newContent, 'utf-8');

}

// 提供静态文件
// 使用更可靠的方式计算静态文件路径
const staticFilesPath = path.resolve(__dirname, '..', '..', '..', 'dist', 'src', 'routes', 'static');
// 开发环境备用路径
const devStaticFilesPath = path.resolve(__dirname, 'static');

// 判断路径是否存在，选择正确的路径
const finalStaticPath = fs.existsSync(staticFilesPath) ? staticFilesPath :
                        fs.existsSync(devStaticFilesPath) ? devStaticFilesPath :
                        path.resolve(process.cwd(), 'dist', 'src', 'routes', 'static');

// console.log('静态文件路径:', finalStaticPath); // 添加日志以便调试
router.use('/ui', express.static(finalStaticPath));

/**
 * 获取日志列表，支持分页和丰富的筛选条件
 * GET /api-logs?page=1&limit=20&method=GET&path=/api/users&startDate=2025-01-01&endDate=2025-01-31&id=xxx&ip=192.168&stack=error&headers=Auth&requestBody=query&responseBody=success&status=200
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    // ID精确查询
    if (req.query.id) {
      where.id = req.query.id;
    }

    // 按方法筛选
    if (req.query.method) {
      where.method = req.query.method;
    }

    // 按路径筛选（支持模糊搜索）
    if (req.query.path) {
      where.path = {
        [Op.like]: `%${req.query.path}%`
      };
    }

    // 按状态码筛选
    if (req.query.status) {
      where.status = parseInt(req.query.status as string);
    }

    // IP地址模糊查询
    if (req.query.ip) {
      where.ip = {
        [Op.like]: `%${req.query.ip}%`
      };
    }

    // 栈信息模糊查询
    if (req.query.stack) {
      where.stack = {
        [Op.like]: `%${req.query.stack}%`
      };
    }

    // 请求头查询
    if (req.query.headers) {
      where.headers = {
        [Op.like]: `%${req.query.headers}%`
      };
    }

    // 请求内容查询
    if (req.query.requestBody) {
      where.requestBody = {
        [Op.like]: `%${req.query.requestBody}%`
      };
    }

    // 响应内容查询
    if (req.query.responseBody) {
      where.responseBody = {
        [Op.like]: `%${req.query.responseBody}%`
      };
    }

    // 按日期范围筛选
    if (req.query.startDate || req.query.endDate) {
      where.timestamp = {};

      if (req.query.startDate) {
        where.timestamp[Op.gte] = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        where.timestamp[Op.lte] = new Date(req.query.endDate as string);
      }
    }    // 执行查询，只选择列表需要的字段
    const { count, rows } = await ApiLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['timestamp', 'DESC']],
      attributes: ['id', 'method', 'path', 'status', 'responseTime', 'ip', 'timestamp'], // 只返回列表需要的字段
    });

    // 返回结果
    res.json({
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching API logs:', error);
    res.status(500).json({ error: '获取日志失败' });
  }
});

/**
 * 获取日志详情
 * GET /api-logs/info/:id
 */
router.get('/info/:id', async (req: Request, res: Response) => {
  try {
    const log = await ApiLog.findByPk(req.params.id);

    if (!log) {
      return res.status(404).json({ error: '日志不存在' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching API log details:', error);
    res.status(500).json({ error: '获取日志详情失败' });
  }
});

/**
 * 获取日志统计信息
 * GET /api-logs/stats
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    // 查询条件
    const where: any = {};

    // 按日期范围筛选
    if (req.query.startDate || req.query.endDate) {
      where.timestamp = {};

      if (req.query.startDate) {
        where.timestamp[Op.gte] = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        where.timestamp[Op.lte] = new Date(req.query.endDate as string);
      }
    }

    // 总请求数
    const totalRequests = await ApiLog.count({ where });

    // 各状态码分布
    const statusCodeDistribution = await ApiLog.findAll({
      attributes: ['status', [ApiLog.sequelize!.fn('COUNT', '*'), 'count']],
      where,
      group: ['status'],
      raw: true
    });

    // 各方法分布
    const methodDistribution = await ApiLog.findAll({
      attributes: ['method', [ApiLog.sequelize!.fn('COUNT', '*'), 'count']],
      where,
      group: ['method'],
      raw: true
    });

    // 平均响应时间
    const avgResponseTime = await ApiLog.findAll({
      attributes: [[ApiLog.sequelize!.fn('AVG', ApiLog.sequelize!.col('responseTime')), 'avgTime']],
      where,
      raw: true
    });

    res.json({
      totalRequests,
      statusCodeDistribution,
      methodDistribution,
      // averageResponseTime: avgResponseTime[0]['avgTime'] || 0,
    });
  } catch (error) {
    console.error('Error fetching API log statistics:', error);
    res.status(500).json({ error: '获取日志统计信息失败' });
  }
});


const getRouter = (auth?:AuthOptions) => {
  if(auth){
    /**
     * 登录
     */
    router.post('/login', async (req: Request, res: Response) => {

      const { password } = req.body;

      // 简单的用户名和密码验证
      if (password === auth.password) {
        // 模拟生成一个token
        const ip = getIp(req).replace(/::ffff:/, '')
        const token = jwtEncodeInExpire({ip}, auth.secret, auth.exp||360000);
        // console.log(`登录成功，IP: ${ip}, Token: ${token}`);
        res.json({ token });
      } else {
        res.status(400).json({ error: '无效的密码' });
      }
    })
  }

  return router
}
router.use(express.json()); // 解析 JSON 格式的请求体
router.use(express.urlencoded({ extended: true })); // 解析 URL 编码的请求体
export default getRouter;
