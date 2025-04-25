/**
 * API 日志查询系统主应用
 * 使用常规 JS 组件模式
 */

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    try {

        // 初始化步骤 1: 初始化搜索筛选器
        SearchFilterManager.init();

        // 初始化步骤 2: 初始化日志列表
        LogListManager.init();
        
        UIManager.initResizable();

        // 应用加载完成
        console.log('API 日志查询系统已初始化');
    } catch (error) {
        console.error('应用初始化失败:', error);
        UIManager.showAlert('系统初始化失败，请刷新页面重试', 'danger', 10000);
    }
});

//解析hase路由
// 解析URL中的hash参数
function parseHashParams() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const parsedParams = {};
    for (const [key, value] of params.entries()) {
        parsedParams[key] = value;
    }
    return parsedParams;
}
//解析路由后并根据路由进入页面
function logListManager() {
    let hashObj = parseHashParams();
    let hash = "";
    const param = {};
    Object.keys(hashObj).forEach((key,index)=>{
        if(index==0){
            //第一个可能有参数
            const tempList = key.replace('/', '').split('?');
            hash = tempList[0];
            if(tempList.length>1){
                const tempKey = tempList[1]
                param[tempKey] = hashObj[key];
            }
        }else{
            param[key] = hashObj[key];
        }
    })
    ConfigManager.hash = hash;
    switch (hash) {
        case 'list':
            UIManager.openHome(param);
            console.log('打开日志列表');
            break;
        case 'info':
            // 处理日志详情页面
            UIManager.openDetail(param);
            break;
        default:
            // 默认是合并页面双列展示
            UIManager.defaultPage(param);
            break;
    }
    // hash = hash.replace('#', '');
    // 在这里处理hash参数变化
    // console.log('Hash参数:',hashObj,hash,param);

}


//监听hash变化
window.addEventListener('hashchange', logListManager);
// 例如，更新UI或加载新的数据
// 监听hash变化
window.addEventListener('load', logListManager);

