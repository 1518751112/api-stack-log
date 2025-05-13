/**
 * 配置管理器组件
 * 负责加载和管理应用配置
 */
/** @type {{ config: { apiBasePath: string, pageSize: number, path: string }, configLoaded: boolean, getApiUrl: (endpoint: string) => string },hash:string} */
const ConfigManager = {
    // 配置
    config: {
        "apiBasePath": 'https://s2d.orbitsoft.cn/202p', // 默认使用相对路径，可以通过修改这个值来配置不同的API路径
        pageSize: 20,    // 每页显示的记录数
        path: 'api-logs' // API日志路径
    },

    configLoaded: false,

    /**
     * 获取API路径
     * @param {string} endpoint 端点路径
     * @returns {string} 完整的API URL
     */
    getApiUrl: function(endpoint) {
        if (!endpoint) endpoint = '/';

        // 确保endpoint开头有斜杠
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }

        return `${this.config.apiBasePath}/${this.config.path}${endpoint}`;
    },
    hash:null
};
