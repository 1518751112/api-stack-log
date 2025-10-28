import {DataTypes, Model, Optional, Sequelize} from 'sequelize';
import {v4 as uuidv4} from 'uuid';

// 定义 API 日志属性接口
export interface ApiLogAttributes {
  id: string;
  method: string;
  path: string;
  status: number;
  responseTime: number;
  ip: string;
  headers: string; // 存储完整的请求头信息，而不仅是 userAgent
  requestBody?: string;
  responseBody?: string;
  query?: string;
  params?: string;
  stack?: string;
  printData?: string; // 存储打印数据
  timestamp: Date;
}

// 创建时的可选属性
interface ApiLogCreationAttributes extends Optional<ApiLogAttributes, 'id' | 'timestamp'> {}

// 定义 ApiLog 模型
class ApiLog extends Model<ApiLogAttributes, ApiLogCreationAttributes> implements ApiLogAttributes {
  public id!: string;
  public method!: string;
  public path!: string;
  public status!: number;
  public responseTime!: number;
  public ip!: string;
  public headers!: string; // 存储完整的请求头信息
  public requestBody?: string;
  public responseBody?: string;
  public query?: string;
  public params?: string;
  public stack?: string;
  public printData?: string; // 存储打印数据
  public timestamp!: Date;
}

// 初始化模型
const ApiLogInit = (sequelize:Sequelize)=>{
    ApiLog.init(
        {    id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: () => uuidv4(),
                unique: true,
            },
            method: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            path: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            responseTime: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            ip: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            headers: {
                type: DataTypes.TEXT,
                allowNull: true,
            },requestBody: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            responseBody: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            query: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            params: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            stack: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            printData: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },        {
            sequelize,
            tableName: 'api_logs',
            timestamps: false,
            indexes: [
                {
                    fields: ['id'],
                },
                {
                    fields: ['path'],
                },
                {
                    fields: ['method'],
                },
                {
                    fields: ['status'],
                },
                {
                    fields: ['ip'],
                },
                {
                    fields: ['timestamp'],
                },
            ],
            defaultScope: {
                order: [['timestamp', 'DESC']], // 默认按时间戳降序排列，最新的记录在前面
            }
        }
    );
}

export {
    ApiLogInit
}
export default ApiLog;
