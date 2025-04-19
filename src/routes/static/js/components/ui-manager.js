/**
 * UI 管理器组件
 * 负责处理界面交互和动画效果
 */
const UIManager = {

    /**
     * 显示或隐藏筛选面板
     */
    toggleFilterPanel: function() {
        const panel = document.getElementById('filter-panel');
        const toggleBtn = document.getElementById('toggle-filter-btn');

        if (panel.classList.contains('show')) {
            // 隐藏面板动画
            panel.style.maxHeight = `${panel.scrollHeight}px`; // 设置当前高度
            setTimeout(() => {
                panel.style.maxHeight = '0';
                panel.style.opacity = '0';
            }, 10);
            toggleBtn.innerHTML = '<i class="bi bi-funnel"></i> 筛选';
            panel.classList.remove('show');
        } else {
            // 显示面板动画
            panel.style.maxHeight = '0'; // 确保从 0 开始
            panel.style.display = 'block';
            setTimeout(() => {
                panel.style.maxHeight = `${panel.scrollHeight}px`;
                panel.style.opacity = '1';
            }, 10);
            toggleBtn.innerHTML = '<i class="bi bi-funnel-fill"></i> 隐藏筛选';
            panel.classList.add('show');
        }
    },

    /**
     * 切换到详情页面
     * @param {Element} detailPage 详情页面元素
     */
    showDetailPage: function(detailPage) {

        // 确保参数有效
        if (!detailPage) detailPage = document.getElementById('detail-page');
        if (!detailPage) {
            console.error('无法找到所需的页面元素');
            return;
        }

        // 显示详情页并隐藏列表页
        // listPage.style.display = 'none';
        detailPage.style.opacity = '0';
        detailPage.style.display = 'block';

        // 淡入动画
        setTimeout(() => {
            detailPage.style.transition = 'opacity 0.3s ease';
            detailPage.style.opacity = '1';
        }, 10);
    },

    /**
     * 返回列表页面
     */
    backToList: function() {
        const detailPage = document.getElementById('detail-page');
        const listPage = document.getElementById('list-page');

        if (!detailPage || !listPage) return;

        // 淡出动画
        detailPage.style.transition = 'opacity 0.3s ease';
        detailPage.style.opacity = '0';

        setTimeout(() => {
            detailPage.style.display = 'none';
            listPage.style.display = 'block';
            setTimeout(() => {
                listPage.style.opacity = '1';
            }, 10);
        }, 300);
    },

    /**
     * 显示消息提示
     * @param {string} message 消息内容
     * @param {string} type 消息类型 (success, warning, danger, info)
     * @param {number} duration 显示时长(毫秒)
     */
    showAlert: function(message, type = 'info', duration = 3000) {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) {
            console.error('找不到alert-container元素');
            return;
        }

        const alertId = 'alert-' + Date.now();

        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="关闭"></button>
            </div>
        `;

        alertContainer.insertAdjacentHTML('beforeend', alertHTML);

        // 添加动画效果
        const alertElement = document.getElementById(alertId);
        if (!alertElement) return;

        alertElement.style.transform = 'translateY(-20px)';
        alertElement.style.opacity = '0';

        setTimeout(() => {
            alertElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            alertElement.style.transform = 'translateY(0)';
            alertElement.style.opacity = '1';
        }, 10);

        // 自动关闭
        setTimeout(() => {
            if (alertElement && alertElement.parentNode) {
                alertElement.style.transform = 'translateY(-20px)';
                alertElement.style.opacity = '0';

                setTimeout(() => {
                    if (alertElement && alertElement.parentNode) {
                        alertElement.remove();
                    }
                }, 300);
            }
        }, duration);
    },

    /**
     * 格式化日期时间
     * @param {string} dateString 日期字符串
     * @param {boolean} showSeconds 是否显示秒数
     * @returns {string} 格式化后的日期字符串
     */
    formatDate: function(dateString, showSeconds = false) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // 如果日期无效，返回原字符串

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        if (showSeconds) {
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else {
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        }
    },

    /**
     * 获取状态码样式类
     * @param {number} status 状态码
     * @returns {string} 样式类名
     */
    getStatusClass: function(status) {
        if (!status) return '';

        const statusCode = Number(status);
        if (isNaN(statusCode)) return '';

        const statusClass = Math.floor(statusCode / 100);
        switch (statusClass) {
            case 2: return 'status-2xx'; // 成功
            case 3: return 'status-3xx'; // 重定向
            case 4: return 'status-4xx'; // 客户端错误
            case 5: return 'status-5xx'; // 服务器错误
            default: return '';
        }
    },

    /**
     * 获取HTTP方法样式类
     * @param {string} method HTTP方法
     * @returns {string} 样式类名
     */
    getMethodClass: function(method) {
        if (!method) return 'bg-secondary';

        const methodClasses = {
            'GET': 'bg-success',
            'POST': 'bg-primary',
            'PUT': 'bg-info',
            'DELETE': 'bg-danger',
            'PATCH': 'bg-warning',
            'HEAD': 'bg-secondary',
            'OPTIONS': 'bg-secondary'
        };

        return methodClasses[method] || 'bg-secondary';
    },

    /**
     * 格式化和高亮JSON代码
     * @param {string} jsonString JSON字符串
     * @returns {string} 格式化并高亮的HTML
     */
    formatAndHighlightJson: function(jsonString) {
        if (!jsonString) return '';

        try {
            // 尝试解析和格式化JSON
            const parsedJson = typeof jsonString === 'object' ? jsonString : JSON.parse(jsonString);
            const formattedJson = JSON.stringify(parsedJson, null, 2);

            // 简单的语法高亮
            return formattedJson
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
                    let cls = 'json-number'; // 数字
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'json-key'; // 键
                        } else {
                            cls = 'json-string'; // 字符串
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'json-boolean'; // 布尔值
                    } else if (/null/.test(match)) {
                        cls = 'json-null'; // null
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                });
        } catch (e) {
            // 如果解析JSON失败，至少确保转义HTML字符
            return String(jsonString)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
    },

    /**
     * 格式化栈轨迹并添加可折叠功能
     * @param {string} stackTrace 栈轨迹字符串
     * @returns {string} 格式化的HTML
     */
    formatStackTrace: function(stackTrace) {
        if (!stackTrace) return '';

        // 确保栈轨迹是字符串
        const stackString = String(stackTrace);

        // 转义HTML字符
        const escapedStack = stackString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // 分割行并添加折叠功能
        const lines = escapedStack.split('\n');

        if (lines.length <= 3) {
            return escapedStack; // 如果行数少，不添加折叠功能
        }

        // 显示前3行，其余折叠
        const visibleLines = lines.slice(0, 3).join('<br>');
        const collapsedLines = lines.slice(3).join('<br>');

        return `
            ${visibleLines}
            <div class="collapsed-content" style="display: none;">${collapsedLines}</div>
            <button class="btn btn-sm btn-link toggle-stack mt-2">
                <span class="show-more">显示更多</span>
                <span class="show-less" style="display: none;">显示更少</span>
            </button>
        `;
    },

    /**
     * 添加复制按钮到代码块
     * @param {string} elementId 代码块元素ID
     */
    addCopyButton: function(elementId) {
        const codeBlock = document.getElementById(elementId);
        if (!codeBlock) return;

        // 检查是否已经添加了复制按钮
        if (codeBlock.parentNode.querySelector('.copy-btn')) return;

        // 创建按钮元素
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-sm btn-outline-secondary copy-btn';
        copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> 复制';
        copyBtn.style.position = 'absolute';
        copyBtn.style.top = '10px';
        copyBtn.style.right = '10px';

        // 添加到代码块容器
        if (codeBlock.parentNode.style.position !== 'relative') {
            codeBlock.parentNode.style.position = 'relative';
        }
        codeBlock.parentNode.appendChild(copyBtn);

        // 添加点击事件
        copyBtn.addEventListener('click', () => {
            const textToCopy = codeBlock.textContent || '';

            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    copyBtn.innerHTML = '<i class="bi bi-check"></i> 已复制';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> 复制';
                    }, 2000);
                })
                .catch(err => {
                    console.error('复制失败:', err);
                    copyBtn.innerHTML = '<i class="bi bi-x"></i> 复制失败';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> 复制';
                    }, 2000);
                });
        });
    },

    /**
     * 初始化栈轨迹的折叠/展开功能
     */
    initStackToggle: function() {
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('toggle-stack') ||
                e.target.parentElement.classList.contains('toggle-stack')) {

                const btn = e.target.classList.contains('toggle-stack') ? e.target : e.target.parentElement;
                const showMore = btn.querySelector('.show-more');
                const showLess = btn.querySelector('.show-less');
                const content = btn.previousElementSibling;

                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    showMore.style.display = 'none';
                    showLess.style.display = 'inline';
                } else {
                    content.style.display = 'none';
                    showMore.style.display = 'inline';
                    showLess.style.display = 'none';
                }
            }
        });
    }
}
