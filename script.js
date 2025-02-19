// GitHub 配置
const GITHUB_CONFIG = {
    owner: 'koshinndana',
    repo: 'draw-lots',
    path: 'data/records.json'
};

// 添加用户名存储
let currentUser = '';

// GitHub API 操作
const githubAPI = {
    async getRecords() {
        try {
            const token = getGitHubToken();
            if (!token) return null;

            const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`, {
                headers: {
                    'Authorization': `token ${token}`
                }
            });
            
            if (!response.ok) return null;
            
            const data = await response.json();
            // 使用 decodeURIComponent 处理中文字符
            const content = decodeURIComponent(escape(atob(data.content)));
            return {
                content: JSON.parse(content),
                sha: data.sha
            };
        } catch (error) {
            console.error('获取记录失败:', error);
            return null;
        }
    },

    async saveRecords(records, sha) {
        try {
            const token = getGitHubToken();
            if (!token) {
                console.log('未获取到 token');
                return false;
            }

            // 使用 encodeURIComponent 处理中文字符
            const jsonString = JSON.stringify(records, null, 2);
            const content = btoa(unescape(encodeURIComponent(jsonString)));

            const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: '更新抽签记录',
                    content: content,
                    sha: sha
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('保存失败：', errorData);
                return false;
            }

            console.log('成功保存记录');
            return true;
        } catch (error) {
            console.error('保存记录时发生错误：', error);
            return false;
        }
    }
};

// Token 管理函数
function getGitHubToken() {
    let token = localStorage.getItem('github_token');
    if (!token) {
        token = prompt('请输入 GitHub Token 以启用统计功能：');
        if (token) {
            localStorage.setItem('github_token', token);
        }
    }
    return token;
}

function resetToken() {
    localStorage.removeItem('github_token');
    location.reload();
}

// 在这里添加重置记录函数
async function resetRecords() {
    if (!confirm('确定要清空所有记录吗？')) {
        return;
    }

    const recordsData = await githubAPI.getRecords();
    if (!recordsData) {
        alert('获取记录失败');
        return;
    }

    const newData = {
        records: [],
        lastReset: new Date().toISOString()
    };

    const success = await githubAPI.saveRecords(newData, recordsData.sha);
    if (success) {
        alert('记录已清空');
        location.reload(); // 刷新页面
    } else {
        alert('清空记录失败');
    }
}

// 用户登录检查函数
function checkUser() {
    if (!currentUser) {
        const username = prompt('请输入您的名字：');
        if (username && username.trim()) {
            currentUser = username.trim();
            document.getElementById('current-user').textContent = `当前用户：${currentUser}`;
        } else {
            alert('请输入有效的用户名！');
            return false;
        }
    }
    return true;
}

const groups = {
    art: ['Yoyo', '辣椒', '袁博', '文皓'],
    eng: ['志勇', '曾卫', '王科', '奕昂', 'Eric'],
    others: ['姗姗', '鼠标', '菀泠', '玉洁']
};

// 抽签函数
async function draw(groupName) {
    if (!checkUser()) {
        return;
    }

    const token = getGitHubToken();
    if (!token) {
        alert('需要设置 GitHub Token 才能使用统计功能');
        return;
    }

    // 获取当前记录
    const recordsData = await githubAPI.getRecords() || { content: { records: [], lastReset: null }, sha: null };
    const { content: data, sha } = recordsData;

    // 检查是否需要重置（每周一凌晨）
    const now = new Date();
    if (data.lastReset) {
        const lastReset = new Date(data.lastReset);
        if (getWeekNumber(now) !== getWeekNumber(lastReset)) {
            data.records = [];
        }
    }
    data.lastReset = now.toISOString();

    // 执行抽签
    const group = groups[groupName];
    const randomIndex = Math.floor(Math.random() * group.length);
    const selectedMember = group[randomIndex];

     // 记录抽签结果
    const record = {
        time: now.toISOString(),
        group: groupName,
        member: selectedMember,
        operator: currentUser
    };

    // 确保 data.records 是数组
    if (!Array.isArray(data.records)) {
        data.records = [];
    }
    
    data.records.push(record);
    console.log('添加新记录：', record); // 添加调试日志

    // 保存记录
    const saveResult = await githubAPI.saveRecords(data, sha);
    if (!saveResult) {
        console.error('保存记录失败');
        alert('保存记录失败，请稍后重试');
        return;
    }

    // 更新显示
    updateDisplay(groupName, selectedMember, data.records);
}

// 更新显示函数
function updateDisplay(groupName, selectedMember, records) {
    // 显示最新结果
    const resultDiv = document.getElementById(`${groupName}-result`);
    const currentResults = resultDiv.innerHTML;
    resultDiv.innerHTML = `
        <p>
            <span class="draw-result">${selectedMember}</span> 
            <span class="draw-info">- 由 ${currentUser} 抽取于 ${new Date().toLocaleString()}</span>
        </p>
        ${currentResults}
    `;

    // 更新统计信息
    updateStatistics(records);
}

// 更新统计信息
function updateStatistics(records) {
    console.log('正在更新统计，当前记录：', records); // 添加调试日志

    // 初始化所有成员的统计数据为0
    const stats = {};
    for (const group in groups) {
        groups[group].forEach(member => {
            stats[member] = 0;
        });
    }

    // 统计本周的抽取次数
    if (records && records.length > 0) {
        const currentWeek = getWeekNumber(new Date());
        records.forEach(record => {
            // 检查记录是否属于本周
            if (getWeekNumber(new Date(record.time)) === currentWeek) {
                stats[record.member] = (stats[record.member] || 0) + 1;
            }
        });
    }

    console.log('统计结果：', stats); // 添加调试日志

    // 显示统计
    const statsDiv = document.getElementById('statistics');
    let html = '<h3>本周统计</h3><ul>';
    for (const group in groups) {
        const groupName = group === 'art' ? '美术组' : group === 'eng' ? '工程组' : '其他组';
        html += `<li><strong>${groupName}：</strong>`;
        groups[group].forEach(member => {
            html += `${member}(${stats[member]}次) `;
        });
        html += '</li>';
    }
    html += '</ul>';
    statsDiv.innerHTML = html;
}


// 获取周数的辅助函数
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 退出登录功能
function logout() {
    currentUser = '';
    document.getElementById('current-user').textContent = '未登录';
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 先检查 token
    const token = getGitHubToken();
    if (!token) {
        alert('需要设置 GitHub Token 才能使用统计功能');
        return;
    }

    // 获取并显示记录
    const recordsData = await githubAPI.getRecords();
    if (recordsData) {
        updateStatistics(recordsData.content.records);
    }
});
