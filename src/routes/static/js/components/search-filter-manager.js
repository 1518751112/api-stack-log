/**
 * 搜索筛选器组件
 * 负责处理搜索筛选相关功能
 */
const SearchFilterManager = {
    // 当前搜索参数
    currentSearchParams: {},

    /**
     * 初始化搜索表单事件监听
     */
    init: function() {
        // 注册筛选面板切换事件
        document.getElementById('toggle-filter-btn').addEventListener('click', UIManager.toggleFilterPanel);

        // 注册搜索表单提交事件
        document.getElementById('search-form').addEventListener('submit', this.handleSearch);

        // 注册重置按钮事件
        document.getElementById('reset-btn').addEventListener('click', this.resetSearch);
    },

    /**
     * 处理搜索表单提交
     * @param {Event} e 事件对象
     */
    handleSearch: function(e) {
        e.preventDefault();

        // 收集搜索参数
        const searchParams = {
            id: document.getElementById('search-id').value.trim(),
            path: document.getElementById('search-path').value.trim(),
            method: document.getElementById('search-method').value,
            status: document.getElementById('search-status').value,
            ip: document.getElementById('search-ip').value.trim(),
            startDate: document.getElementById('search-start-date').value,
            endDate: document.getElementById('search-end-date').value,
            requestBody: document.getElementById('search-request-body').value.trim(),
            responseBody: document.getElementById('search-response-body').value.trim(),
            stack: document.getElementById('search-stack').value.trim(),
            headers: document.getElementById('search-headers').value.trim()
        };

        // 移除空值
        Object.keys(searchParams).forEach(key => {
            if (!searchParams[key]) {
                delete searchParams[key];
            }
        });

        // 保存当前搜索参数
        SearchFilterManager.currentSearchParams = searchParams;

        // 重置为第一页并加载数据
        LogListManager.currentPage = 1;
        LogListManager.loadLogs();

        // 隐藏筛选面板
        const filterPanel = document.getElementById('filter-panel');
        if (Object.keys(searchParams).length > 0 && filterPanel.style.display !== 'none') {
            UIManager.toggleFilterPanel();
        }
    },

    /**
     * 重置搜索表单
     */
    resetSearch: function() {
        // 重置表单字段
        document.getElementById('search-form').reset();

        // 清空搜索参数
        SearchFilterManager.currentSearchParams = {};

        // 重置为第一页并加载数据
        LogListManager.currentPage = 1;
        LogListManager.loadLogs();
    },

    /**
     * 构建查询参数字符串
     * @param {Object} extraParams 额外的参数
     * @returns {string} 查询参数字符串
     */
    buildQueryParams: function(extraParams = {}) {
        const params = { ...this.currentSearchParams, ...extraParams };
        return new URLSearchParams(params).toString();
    }
};
