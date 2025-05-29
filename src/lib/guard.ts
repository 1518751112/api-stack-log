import {ApiLoggerOptions} from "../../index";
import {NextFunction, Request, Response} from "express";
import {jwtDecode} from "../utils/crypt.util";

export default function guard(config: ApiLoggerOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
        //只鉴权config.routePrefix 下的接口
        if (!req.path.startsWith(config.routePrefix+"/")) {
            return next();
        }
        //过滤路径 ui 和 login
        if (req.path.startsWith(`${config.routePrefix}/ui`) || req.path.startsWith(`${config.routePrefix}/login`)) {
            return next();
        }
        const token = req.headers['authorization']||"";
        const data = jwtDecode(token,config?.auth?.secret||"")
        if (!data) {
            return res.status(401).json({ error: 'Forbidden' });
        }
        next();
    }
}
