// 添加用户名存储
let currentUser = '';

// 添加用户登录检查函数
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
function draw(groupName) {
    // 检查是否已登录
    if (!checkUser()) {
        return;
    }

    const group = groups[groupName];
    const randomIndex = Math.floor(Math.random() * group.length);
    const selectedMember = group[randomIndex];
    
    // 显示结果
    const resultDiv = document.getElementById(`${groupName}-result`);
    const currentResults = resultDiv.innerHTML;
    resultDiv.innerHTML = `
        <p>
            <span class="draw-result">${selectedMember}</span> 
            <span class="draw-info">- 由 ${currentUser} 抽取于 ${new Date().toLocaleString()}</span>
        </p>
        ${currentResults}
    `;
}

// 添加退出登录功能
function logout() {
    currentUser = '';
    document.getElementById('current-user').textContent = '未登录';
}
