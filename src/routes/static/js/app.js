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

        // 应用加载完成
        console.log('API 日志查询系统已初始化');
    } catch (error) {
        console.error('应用初始化失败:', error);
        UIManager.showAlert('系统初始化失败，请刷新页面重试', 'danger', 10000);
    }
});
