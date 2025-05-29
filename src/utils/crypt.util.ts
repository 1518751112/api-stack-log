import * as jwt from 'jsonwebtoken'
import {Request} from "express";

export function jwtDecode(token: string,secret:string) {
  if (token) {
    token = token.substr(0, 7) == 'Bearer ' ? token.substr(7) : token
    try {
      let payload:any = jwt.verify(token, secret)
      delete payload.exp
      delete payload.iat
      return payload
    } catch (err) {
      return null
    }
  } else {
    return null
  }
}
/**
 * token加密
 * @param payload 加密数据
 * @param secret 密钥
 * @param second 过期时间 秒
 */

export function jwtEncodeInExpire(payload: object,secret:string, second: number = 5 * 24 * 60 * 60) {
  return jwt.sign(payload, secret, { expiresIn: second })
}

export function getIp(req:Request){
  return (req.headers['x-real-ip'] as string) || (req.headers['http_x_forwarded_for'] as string) || (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress as string) || req.ip || ''
}
