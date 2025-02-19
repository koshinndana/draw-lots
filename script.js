// 将 GITHUB_CONFIG 修改为：
const GITHUB_CONFIG = {
    owner: 'koshinndana',
    repo: 'draw-lots',
    path: 'data/records.json',
    token: '' // 不在代码中直接存储 token
};

// 添加获取 token 的函数
function getGitHubToken() {
    let token = localStorage.getItem('github_token');
    if (!token) {
        token = prompt('请输入 GitHub Token：');
        if (token) {
            localStorage.setItem('github_token', token);
        }
    }
    return token;
}

// 修改 githubAPI 中的 headers
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
            // ... 其余代码保持不变 ...
        }
    },

    async saveRecords(records, sha) {
        try {
            const token = getGitHubToken();
            if (!token) return false;

            const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                // ... 其余代码保持不变 ...
            });
            // ... 其余代码保持不变 ...
        }
    }
};

// ... 其余代码保持不变 ...
