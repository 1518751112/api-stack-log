/**
 * 日志列表管理器组件
 * 负责处理日志列表显示和分页功能
 */

const style = {
    '--w-rjv-font-family': 'monospace',
    '--w-rjv-color': '#89ca78',
    '--w-rjv-key-string': '#f9c74f',
    '--w-rjv-background-color': '#272822',
    '--w-rjv-line-color': '#3e3d32',
    '--w-rjv-arrow-color': '#f8f8f2',
    '--w-rjv-edit-color': 'var(--w-rjv-color)',
    '--w-rjv-info-color': '#cecece4d',
    '--w-rjv-update-color': '#5f5600',
    '--w-rjv-copied-color': '#E6DB74',
    '--w-rjv-copied-success-color': '#28a745',

    '--w-rjv-curlybraces-color': '#f8f8f2',
    '--w-rjv-colon-color': '#f8f8f2',
    '--w-rjv-brackets-color': '#f8f8f2',
    '--w-rjv-quotes-color': 'var(--w-rjv-key-string)',
    '--w-rjv-quotes-string-color': 'var(--w-rjv-type-string-color)',

    '--w-rjv-type-string-color': '#4cc9f0',
    '--w-rjv-type-int-color': '#8e4fff',
    '--w-rjv-type-float-color': '#8e4fff',
    '--w-rjv-type-bigint-color': '#8e4fff',
    '--w-rjv-type-boolean-color': '#dc13da',
    '--w-rjv-type-date-color': '#fd9720c7',
    '--w-rjv-type-url-color': '#55a3ff',
    '--w-rjv-type-null-color': '#adb5bd',
    '--w-rjv-type-nan-color': '#FD971F',
    '--w-rjv-type-undefined-color': '#FD971F',
    'font-size': '0.98rem',
    'font-family': 'var(--bs-font-monospace)',
    'background-color': '#23272e',
}

/**
 * @typedef {Object} LogListManager
 * @property {function(number): void} goToPage - 跳转到指定页
 * @property {function(): Promise<void>} loadLogs - 加载日志列表数据
 * @property {function(): Promise<void>} viewLogDetails - 查看日志详情
 */
const LogListManager = /** @type {LogListManager} */ ({
    // 状态变量
    currentPage: 1,
    totalRecords: 0,

    /**
     * 初始化日志列表
     */
    /*init: function() {
        // 注册返回列表按钮事件
        document.getElementById('back-btn').addEventListener('click', UIManager.backToList);

        // 初始加载数据
        this.loadLogs();
    },*/

    /**
     * 发送fetch请求
     * @param {string} url
     * @param options
     * @returns {Promise<Response>}
     */
    fetch: async function (url, options = {}) {
        // 添加认证头
        const token = this.getToken();
        if (token) {
            options.headers = (options.headers || {})
            options.headers['Authorization'] = `Bearer ${token}`
        }
        const result = await fetch(url, options);
        if (result.status === 401) {
            // 如果未授权，提示登录
            UIManager.showAlert('请先登录', 'warning');
            this.login();
            return {
                ok: false,
                status: 401,
                json: async () => ({message: '未授权，请登录'})
            };
        }
        return result
    },
    /**
     * 加载日志列表数据
     */
    loadLogs: async function () {

        try {
            // 构建查询参数
            const queryParams = SearchFilterManager.buildQueryParams({
                page: this.currentPage,
                limit: ConfigManager.config.pageSize
            });

            // 发起API请求
            const response = await this.fetch(`${ConfigManager.getApiUrl('/')}?${queryParams}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // 更新总记录数和当前页码
            this.totalRecords = result.total;
            document.getElementById('total-records').textContent = this.totalRecords;

            // 显示数据
            this.renderLogs(result.data);

            // 更新分页
            this.updatePagination(result.totalPages);

        } catch (error) {
            console.error('加载日志失败:', error);
            UIManager.showAlert('加载日志数据失败，请重试', 'danger');
            document.getElementById('logs-table-body').innerHTML = '';
            document.getElementById('table-empty').style.display = 'block';
        } finally {
        }
    },


    /**
     * 渲染日志列表
     * @param {Array} logs 日志数据数组
     */
    renderLogs: function (logs) {
        const tableBody = document.getElementById('logs-table-body');
        tableBody.innerHTML = '';

        if (!logs || logs.length === 0) {
            document.getElementById('table-empty').style.display = 'block';
            return;
        }

        document.getElementById('table-empty').style.display = 'none';

        logs.forEach((log, index) => {
            const row = document.createElement('tr');
            row.className = 'log-row';
            row.innerHTML = `
                <td>${index + 1}</td>
                <td class="view-btn" style="cursor: pointer;color:#005aef" title="${log.id}">${log.id}</td>
                <td>${UIManager.formatDate(log.timestamp, true)}</td>
                <td>
                    <span class="badge ${UIManager.getMethodClass(log.method)}">${log.method}</span>
                </td>
                <td class="path-cell" title="${log.path}">${log.path}</td>
                <td>
                    <span class="status-badge ${UIManager.getStatusClass(log.status)}">${log.status}</span>
                </td>
                <td>${log.responseTime.toFixed(2)}</td>
                <td>${log.ip}</td>
            `;

            // 为整行添加点击事件监听器
            row.addEventListener('click', () => {
                event.stopPropagation(); // 防止事件冒泡
                if (ConfigManager.hash == 'list') {
                    UIManager.jumpHash('info?id=' + log.id);
                } else {
                    //从右边查看详情
                    this.viewLogDetails(log.id)
                }
                //取消已经选择的类

                document.querySelectorAll('.log-row.selected').forEach(selectedRow => {
                    selectedRow.classList.remove("selected");
                });
                row.classList.add("selected");
            });

            tableBody.appendChild(row);

            // 为复制按钮添加事件监听 同时防止父级事件冒泡或穿透
            const viewBtn = row.querySelector('.view-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', (event) => {
                    event.stopPropagation(); // 防止事件冒泡
                    UIManager.copy(log.id).then(() => {
                        UIManager.showAlert('已复制id到剪贴板', 'success');
                    }).catch(err => {
                        console.error('复制失败:', err);
                        UIManager.showAlert('复制失败，请重试', 'danger');
                    });
                });
            }
        });

        // 添加行悬停动画效果
        const rows = document.querySelectorAll('.log-row');
        rows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                row.style.transition = 'background-color 0.3s ease';
                row.style.backgroundColor = 'rgba(0, 123, 255, 0.05)';
            });

            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = '';
            });
        });
    },

    /**
     * 更新分页控件
     * @param {number} totalPages 总页数
     */
    updatePagination: function (totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        if (totalPages <= 1) {
            return;
        }

        // 上一页
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<div class="page-link" style="cursor: pointer;" aria-label="上一页"><i class="bi bi-chevron-left"></i></div>`;

        if (this.currentPage > 1) {
            prevLi.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        }

        pagination.appendChild(prevLi);

        // 页码按钮逻辑
        let startPage = Math.max(1, this.currentPage - 2);
        let num = 3;

        let endPage = Math.min(totalPages, startPage + num);

        if (endPage - startPage < num) {
            startPage = Math.max(1, endPage - num);
        }

        // 创建可点击的省略号元素
        const createClickableEllipsis = (totalPages) => {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item';
            ellipsisLi.innerHTML = '<div class="page-link" style="cursor: pointer;">...</div>';

            const ellipsisLink = ellipsisLi.querySelector('.page-link');
            ellipsisLink.addEventListener('click', () => {
                // 创建输入框
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'form-control form-control-sm';
                input.style.cssText = 'width: 50px; text-align: center; padding: 2px; border: 1px solid #dee2e6;';
                input.min = '1';
                input.max = totalPages.toString();
                input.placeholder = '页码';

                // 替换省略号为输入框
                ellipsisLink.innerHTML = '';
                ellipsisLink.appendChild(input);
                ellipsisLink.style.padding = '2px';

                // 自动获取焦点
                input.focus();

                // 处理回车键跳转
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const page = parseInt(input.value);
                        if (page >= 1 && page <= totalPages) {
                            this.goToPage(page);
                        } else {
                            UIManager.showAlert(`请输入1-${totalPages}之间的页码`, 'warning');
                        }
                    }
                });

                // 失去焦点时恢复省略号
                input.addEventListener('blur', () => {
                    ellipsisLink.innerHTML = '...';
                    ellipsisLink.style.padding = '';
                });
            });

            return ellipsisLi;
        };

        // 始终显示第一页
        if (endPage > totalPages - 2) {
            const firstPageLi = document.createElement('li');
            firstPageLi.className = `page-item ${1 === this.currentPage ? 'active' : ''}`;
            firstPageLi.innerHTML = `<div class="page-link" style="cursor: pointer;">1</div>`;

            if (1 !== this.currentPage) {
                firstPageLi.addEventListener('click', () => this.goToPage(1));
            }

            pagination.appendChild(firstPageLi);

            pagination.appendChild(createClickableEllipsis(totalPages));

        }

        // 显示中间页码
        for (let i = startPage; i <= endPage; i++) {
            // 第一页已经显示过了，跳过
            // 最后一页在后面单独处理
            if ((i === 1 && startPage === 1) || (i === totalPages && endPage === totalPages)) {

                const pageLi = document.createElement('li');
                pageLi.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
                pageLi.innerHTML = `<div class="page-link" style="cursor: pointer;">${i}</div>`;

                if (i !== this.currentPage) {
                    pageLi.addEventListener('click', () => this.goToPage(i));
                }

                pagination.appendChild(pageLi);
            } else if (i !== 1 && i !== totalPages) {
                const pageLi = document.createElement('li');
                pageLi.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
                pageLi.innerHTML = `<div class="page-link" style="cursor: pointer;">${i}</div>`;

                if (i !== this.currentPage) {
                    pageLi.addEventListener('click', () => this.goToPage(i));
                }

                pagination.appendChild(pageLi);
            }
        }

        // 始终显示最后一页
        if (endPage < totalPages) {
            // 如果结束页码小于总页数-1，显示可点击的省略号
            if (endPage < totalPages - 1) {
                pagination.appendChild(createClickableEllipsis(totalPages));
            }

            const lastPageLi = document.createElement('li');
            lastPageLi.className = `page-item ${totalPages === this.currentPage ? 'active' : ''}`;
            lastPageLi.innerHTML = `<div class="page-link" style="cursor: pointer;">${totalPages}</div>`;

            if (totalPages !== this.currentPage) {
                lastPageLi.addEventListener('click', () => this.goToPage(totalPages));
            }

            pagination.appendChild(lastPageLi);
        }

        // 下一页
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<div class="page-link" style="cursor: pointer;" aria-label="下一页"><i class="bi bi-chevron-right"></i></div>`;

        if (this.currentPage < totalPages) {
            nextLi.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        }

        pagination.appendChild(nextLi);


    },
    /**
     * 跳转到指定页
     * @param {number} page 页码
     */
    goToPage: function (page) {
        this.currentPage = page;

        // 平滑滚动到表格顶部
        const tableElement = document.getElementById('logs-table-body');
        if (tableElement) {
            tableElement.scrollIntoView({behavior: 'smooth'});
        }

        // 延迟加载以便动画看起来更流畅
        setTimeout(() => {
            this.loadLogs();
        }, 300);
    },
    logId: null,
    /**
     * 查看日志详情
     * @param {string} id 日志ID
     */
    viewLogDetails: async function (id) {
        try {
            // 显示详情页面，添加动画
            const detailPage = document.getElementById('detail-page');
            UIManager.showDetailPage(detailPage);
            if (ConfigManager.hash == 'info') {
                //显示返回按钮
                document.getElementById('back-btn').style.display = 'block';
            } else {
                //隐藏返回按钮
                document.getElementById('back-btn').style.display = 'none';
            }

            if (id == this.logId) return
            this.logId = id
            // 发起API请求
            const response = await this.fetch(ConfigManager.getApiUrl(`/info/${id}`));
            //获取响应体大小
            const contentLength = response.headers.get('Content-Length');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const logDetails = await response.json();


            // 填充基本信息
            document.getElementById('detail-id').textContent = logDetails.id;
            document.getElementById('detail-timestamp').textContent = UIManager.formatDate(logDetails.timestamp, true);
            const detailCopyButton = document.getElementById('detail-copy');
            const newDetailCopyButton = detailCopyButton.cloneNode(true);
            // 先移除已有的事件监听器，防止重复添加
            detailCopyButton.replaceWith(newDetailCopyButton);

            newDetailCopyButton.addEventListener('click', () => {
                UIManager.copy(JSON.stringify(logDetails)).then(() => {
                    UIManager.showAlert('已复制到剪贴板', 'success');
                }).catch(err => {
                    console.error('复制失败:', err);
                    UIManager.showAlert('复制失败，请重试', 'danger');
                });
            });
            const reissueButton = document.getElementById('reissue');
            const newReissueButton = reissueButton.cloneNode(true);
            // 先移除已有的事件监听器，防止重复添加
            reissueButton.replaceWith(newReissueButton);

            newReissueButton.addEventListener('click', () => {
                const originalText = newReissueButton.innerHTML;

                // 显示loading状态
                newReissueButton.disabled = true;
                newReissueButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>重发中...';

                this.resendRequest(logDetails).finally(v => {
                    // 恢复按钮状态
                    newReissueButton.disabled = false;
                    newReissueButton.innerHTML = originalText;
                });
            });
            // 获取方法的样式类
            const methodClass = UIManager.getMethodClass(logDetails.method);
            document.getElementById('detail-method').innerHTML = `<span class="badge ${methodClass}">${logDetails.method}</span>`;

            // 获取状态的样式类
            const statusClass = UIManager.getStatusClass(logDetails.status);
            document.getElementById('detail-status').innerHTML = `<span class="status-badge ${statusClass}">${logDetails.status}</span>`;

            // 填充其他基本信息
            document.getElementById('detail-ip').textContent = logDetails.ip;
            document.getElementById('detail-responseTime').textContent = logDetails.responseTime.toFixed(2);
            document.getElementById('detail-path').textContent = logDetails.path;
            document.getElementById('detail-size').textContent = UIManager.formatDataSize(Number(contentLength));

            // 填充选项卡内容，使用JSON格式化并高亮显示
            const formatAndDisplay = (elementId, content) => {
                const element = document.getElementById(elementId);
                if (!content) {
                    element.textContent = '无数据';
                    UIManager.addCopyButton(elementId, ''); // 添加复制按钮
                    return
                }
                let obj;

                try {
                    obj = JSON.parse(content)
                } catch (e) {
                    obj = content
                }
                if (obj == null || typeof obj != 'object' || Array.isArray(obj)) {
                    UIManager.formatAndHighlightJson(content, element);
                } else {

                    try {
                        const {default: JsonView} = window['react-json-view'];
                        //计算字符串长度超过200kb就折叠
                        let collapsed = false
                        if (content.length > 200000) {
                            obj = JSON.parse(content);
                            collapsed = 1;
                        }
                        const options = {
                            key: Date.now(),
                            value: obj, style: style,
                            collapsed,          // 控制是否折叠所有节点（默认展开）[1,3](@ref)
                            indentWidth: 6,            // 缩进宽度，单位字符[1,4](@ref)
                            enableClipboard: true,     // 启用复制功能[1,6](@ref)
                            displayDataTypes: false,    // 隐藏数据类型前缀[1,4](@ref)
                            shortenTextAfterLength: 0
                        }
                        try {
                            ReactDOM.render(
                                React.createElement(JsonView, options),
                                element
                            );
                        } catch (e) {
                            if (e.message.includes('removeChild')) {
                                ReactDOM.render(
                                    React.createElement(JsonView, options),
                                    element
                                );
                            } else {
                                throw e;
                            }
                        }

                    } catch (e) {
                        element.textContent = content;
                    }
                }

                UIManager.addCopyButton(elementId, content); // 添加复制按钮


            };

            formatAndDisplay('detail-query', logDetails.query);
            formatAndDisplay('detail-headers', logDetails.headers);
            formatAndDisplay('detail-requestBody', logDetails.requestBody);
            formatAndDisplay('detail-responseBody', logDetails.responseBody);
            formatAndDisplay('detail-stack', logDetails.stack);


        } catch (error) {
            console.error('加载日志详情失败:', error);
            UIManager.showAlert('加载日志详情失败，请重试', 'danger');
        }
    },

    /**
     * 页面初始化
     */
    init: function () {
        // 注册返回列表按钮事件
        document.getElementById('back-btn').addEventListener('click', UIManager.backToList);
        //每页数量控制
        const pageSize = ConfigManager.config.pageSize;
        const pageSizeSelect = document.getElementById('page-size-select');
        pageSizeSelect.value = pageSize;
        pageSizeSelect.addEventListener('change', (event) => {
            const selectedPageSize = parseInt(event.target.value, 10);
            ConfigManager.config.pageSize = selectedPageSize;
            this.currentPage = 1; // 重置为第一页
            this.loadLogs();
        });
        // 初始加载数据
        this.loadLogs();

        // 初始化栈轨迹折叠功能
        UIManager.initStackToggle();
        const page_mode = document.getElementById('page_mode');
        page_mode.addEventListener('click', () => {
            if (ConfigManager.hash == 'list') {
                UIManager.jumpHash('/');
                page_mode.textContent = "双列模式"
            } else if (ConfigManager.hash != 'info') {
                UIManager.jumpHash('list');
                page_mode.textContent = "单列模式"
            }
        })

        const pre_url = document.getElementById('set-pre-url');
        pre_url.addEventListener('click', () => {
            this.setPreUrl(localStorage.getItem('preUrl'))
        })
    },
    //登陆
    login: async function () {
        //弹窗输入密码
        const password = prompt('请输入密码');
        if (!password) {
            UIManager.showAlert('密码不能为空', 'warning');
            return;
        }
        try {
            const response = await fetch(ConfigManager.getApiUrl('/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify({password})
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.token) {
                UIManager.showAlert('登录成功', 'success');
                // 保存token到localStorage
                this.setToken(result.token)
                // 登录成功后可以执行其他操作，刷新日志列表
                this.loadLogs();
            } else {
                UIManager.showAlert(result.message || '登录失败，请重试', 'danger');
            }
        } catch (error) {
            console.error('登录失败:', error);
            UIManager.showAlert('登录失败，请重试', 'danger');
        }
    },
    setToken: function (token) {
        localStorage.setItem('api_log_token', token);
    },
    getToken: function () {
        // 从localStorage中获取token
        return localStorage.getItem('api_log_token');
    },

    /**
     * 重发请求
     * @param  logDetails 日志详情对象
     */
    resendRequest: async function (logDetails) {
        const preUrl = this.getPreUrl();
        if (!preUrl) {
            return;
        }
        UIManager.showAlert('重发中', 'info');

        let url = `${preUrl}${logDetails.path}`;
        const method = logDetails.method;
        const headers = logDetails.headers;
        const body = logDetails.requestBody;
        const query = logDetails.query;
        const requestData = {
            url: url,
            method: method,
            headers: JSON.parse(headers),
            body: body,
        };
        if (query) {
            // 构建查询参数
            const queryParams = new URLSearchParams(JSON.parse(query)).toString();

            // 发起API请求
            url = `${url}?${queryParams}`
        }
        // 发送请求
        const response = await fetch(url, requestData)

        if (!response.ok) {
            UIManager.showAlert('重发请求失败', 'danger');
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            UIManager.showAlert('重发请求成功,页面已刷新', 'success');
            // 重新加载日志列表
            this.loadLogs();
        }
        console.log("重发信息", response)

    },
    //获取重发请求前置url
    getPreUrl: function () {
        //从存储中获取
        const preUrl = localStorage.getItem('preUrl');
        if (preUrl) {
            return preUrl;
        } else {
            return this.setPreUrl();
        }
    },
    //设置重发请求前置url
    setPreUrl: function (url) {
        // 如果没有存储就弹出输入框输入存储
        const inputUrl = prompt('请输入重发请求的前置URL', url);
        if (inputUrl == null) return
        localStorage.setItem('preUrl', inputUrl);
        if (inputUrl) {
            // 存储到localStorage
            return inputUrl;
        } else {
            UIManager.showAlert('请先设置重发请求的前置URL', 'warning');
            return null;
        }
    }
});
