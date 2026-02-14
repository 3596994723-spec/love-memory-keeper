// API 配置
const API_BASE_URL = 'http://localhost:3001/api';

// 全局变量
let memories = [];
let anniversaries = [];
let messages = [];
let wishes = [];
let moods = [];
let loveStartDate = null;
let currentTheme = localStorage.getItem('loveTheme') || 'pink';
let currentDate = new Date();

// HTTP 请求函数
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        console.log('API request:', method, url, data);
        const response = await fetch(url, options);
        console.log('API response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('API response:', result);
        return result;
    } catch (error) {
        console.error('API request failed:', error);
        showNotification(`网络请求失败: ${error.message}`);
        return null;
    }
}

async function fetchAllData() {
    try {
        // 并行请求所有数据
        const [memoriesData, anniversariesData, messagesData, wishesData, moodsData] = await Promise.all([
            apiRequest('/memories'),
            apiRequest('/anniversaries'),
            apiRequest('/messages'),
            apiRequest('/wishes'),
            apiRequest('/moods')
        ]);
        
        // 处理 MongoDB 返回的 _id 字段，添加 id 属性
        if (memoriesData) {
            memories = memoriesData.map(m => ({ ...m, id: m._id || m.id }));
        }
        if (anniversariesData) {
            anniversaries = anniversariesData.map(a => ({ ...a, id: a._id || a.id }));
        }
        if (messagesData) {
            messages = messagesData.map(m => ({ ...m, id: m._id || m.id }));
        }
        if (wishesData) {
            wishes = wishesData.map(w => ({ ...w, id: w._id || w.id }));
        }
        if (moodsData) {
            moods = moodsData.map(m => ({ ...m, id: m._id || m.id }));
        }
        
        // 渲染所有页面
        renderMemories();
        renderAnniversaries();
        renderCalendar();
        renderMessages();
        renderWishes();
        renderMoods();
        renderPhotoWall();
        renderCountdown();
        
        showNotification('数据加载成功！');
    } catch (error) {
        console.error('Failed to fetch data:', error);
        showNotification('数据加载失败，使用本地数据');
    }
}
let selectedPhotos = [];
let selectedLocations = [];
let selectedTags = [];
let memoryMap = null;
let editingMemoryId = null;
let editingAnniversaryId = null;
let selectedMood = null;
let isMusicPlaying = false;
let bgMusic = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 应用主题
    document.body.setAttribute('data-theme', currentTheme);
    
    // 从localStorage加载恋爱开始日期
    loveStartDate = localStorage.getItem('loveStartDate') || null;
    console.log('从localStorage加载恋爱开始日期:', loveStartDate);
    
    // 初始化页面
    renderMemories();
    renderAnniversaries();
    renderCalendar();
    renderMessages();
    renderWishes();
    renderMoods();
    renderPhotoWall();
    renderCountdown();
    
    // 启动恋爱计时器
    startLoveTimer();
    
    // 设置默认日期
    document.getElementById('memory-date').valueAsDate = new Date();
    document.getElementById('anniversary-date').valueAsDate = new Date();
    
    // 绑定所有事件
    bindAllEvents();
    
    // 从后端加载数据
    fetchAllData();
});



// 绑定所有事件
function bindAllEvents() {
    // 卡片点击
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function() {
            showPage(this.getAttribute('data-page'));
        });
    });
    
    // 返回按钮
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showPage('home');
        });
    });
    
    // 表单提交
    document.getElementById('memory-form').addEventListener('submit', function(e) {
        e.preventDefault();
        if (editingMemoryId) updateMemory();
        else addMemory();
    });
    
    document.getElementById('anniversary-form').addEventListener('submit', function(e) {
        e.preventDefault();
        if (editingAnniversaryId) updateAnniversary();
        else addAnniversary();
    });
    
    document.getElementById('message-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addMessage();
    });
    
    document.getElementById('wishlist-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addWish();
    });
    
    // AI查询
    document.getElementById('ai-submit').addEventListener('click', sendAIQuery);
    document.getElementById('ai-query').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendAIQuery();
    });
    
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('ai-query').value = this.getAttribute('data-query');
            sendAIQuery();
        });
    });
    
    // 日历导航
    document.getElementById('prev-month').addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('current-month').addEventListener('click', function() {
        const selector = document.getElementById('year-selector');
        document.getElementById('year-input').value = currentDate.getFullYear();
        selector.style.display = 'flex';
    });
    
    document.getElementById('year-confirm').addEventListener('click', function() {
        const year = parseInt(document.getElementById('year-input').value);
        if (year >= 1900 && year <= 2100) {
            currentDate.setFullYear(year);
            renderCalendar();
            document.getElementById('year-selector').style.display = 'none';
        }
    });
    
    // 日期范围切换
    document.getElementById('date-range-toggle').addEventListener('change', function() {
        document.getElementById('single-date-container').style.display = this.checked ? 'none' : 'block';
        document.getElementById('date-range-container').style.display = this.checked ? 'block' : 'none';
        if (this.checked) {
            document.getElementById('memory-start-date').valueAsDate = new Date();
            document.getElementById('memory-end-date').valueAsDate = new Date();
        }
    });
    
    // 照片上传
    document.getElementById('photo-upload').addEventListener('change', handlePhotoUpload);
    
    // 语音输入
    document.getElementById('voice-input-btn').addEventListener('click', startVoiceInput);
    
    // 语音留言
    document.getElementById('voice-message-btn').addEventListener('click', startVoiceMessage);
    
    // 地点搜索
    document.getElementById('search-location-btn').addEventListener('click', searchLocation);
    document.getElementById('memory-location').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchLocation();
        }
    });
    
    // 标签添加
    document.getElementById('add-tag-btn').addEventListener('click', addTag);
    document.getElementById('memory-tag').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    });
    
    // 随机回忆
    document.getElementById('random-memory-btn').addEventListener('click', showRandomMemory);
    document.getElementById('close-random-modal').addEventListener('click', function() {
        document.getElementById('random-memory-modal').style.display = 'none';
    });
    document.getElementById('another-random-btn').addEventListener('click', showRandomMemory);
    
    // 照片弹窗
    document.getElementById('close-photo-modal').addEventListener('click', function() {
        document.getElementById('photo-modal').style.display = 'none';
    });
    
    // 设置开始日期
    document.getElementById('set-start-date').addEventListener('click', function() {
        const date = prompt('请输入恋爱开始日期（格式：YYYY-MM-DD）：', loveStartDate || '');
        if (date) {
            loveStartDate = date;
            localStorage.setItem('loveStartDate', loveStartDate);
            startLoveTimer();
            showNotification('日期设置成功！');
        }
    });
    
    // 心情选择
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedMood = this.getAttribute('data-mood');
        });
    });
    
    // 保存心情
    document.getElementById('save-mood-btn').addEventListener('click', saveMood);
    
    // 音乐控制
    document.getElementById('music-toggle').addEventListener('click', toggleMusic);
    
    // 主题切换
    document.getElementById('theme-toggle').addEventListener('click', function() {
        const panel = document.getElementById('theme-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            document.body.setAttribute('data-theme', theme);
            currentTheme = theme;
            localStorage.setItem('loveTheme', theme);
            document.getElementById('theme-panel').style.display = 'none';
        });
    });
    
    // 设置页面
    document.getElementById('save-start-date-btn').addEventListener('click', async function() {
        const date = document.getElementById('love-start-date').value;
        if (date) {
            loveStartDate = date;
            // 这里可以添加 API 请求来保存恋爱开始日期
            startLoveTimer();
            showNotification('日期保存成功！');
        }
    });
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    document.getElementById('import-data-input').addEventListener('change', importData);
    document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
    
    // 加载恋爱开始日期到设置页面
    if (loveStartDate) {
        document.getElementById('love-start-date').value = loveStartDate;
    }
    
    // 地图状态检查
    document.getElementById('check-map-btn').addEventListener('click', checkMapStatus);
}

// 显示页面
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const target = document.getElementById(pageName + '-page') || document.getElementById('home-page');
    if (target) {
        target.classList.add('active');
        if (pageName === 'calendar') renderCalendar();
        else if (pageName === 'memories') renderMemories();
        else if (pageName === 'anniversary') renderAnniversaries();
        else if (pageName === 'messages') renderMessages();
        else if (pageName === 'wishlist') renderWishes();
        else if (pageName === 'mood') renderMoods();
        else if (pageName === 'photo-wall') renderPhotoWall();
        else if (pageName === 'map') setTimeout(initMap, 100);
        else if (pageName === 'stats') renderStats();
        else if (pageName === 'add-memory' && !editingMemoryId) resetMemoryForm();
        else if (pageName === 'home') {
            renderCountdown();
            startLoveTimer();
        }
    }
}

// 恋爱计时器
function startLoveTimer() {
    const setStartDateBtn = document.getElementById('set-start-date');
    
    // 根据是否设置了恋爱开始日期来显示或隐藏设置按钮
    if (setStartDateBtn) {
        if (loveStartDate) {
            setStartDateBtn.style.display = 'none';
        } else {
            setStartDateBtn.style.display = 'block';
        }
    }
    
    if (!loveStartDate) return;
    
    const startDate = new Date(loveStartDate);
    
    function updateTimer() {
        // 获取当前时间并转换为北京时间（UTC+8）
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const beijingTime = new Date(utc + 8 * 60 * 60 * 1000);
        
        const diff = beijingTime - startDate;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('timer-days').textContent = days;
        document.getElementById('timer-hours').textContent = hours;
        document.getElementById('timer-minutes').textContent = minutes;
        document.getElementById('timer-seconds').textContent = seconds;
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// 纪念日倒计时
function renderCountdown() {
    const list = document.getElementById('countdown-list');
    const section = document.getElementById('countdown-section');
    
    if (anniversaries.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    const today = new Date();
    const upcoming = anniversaries.map(a => {
        const date = new Date(a.date);
        date.setFullYear(today.getFullYear());
        if (date < today) date.setFullYear(today.getFullYear() + 1);
        return { ...a, nextDate: date, daysLeft: Math.ceil((date - today) / (1000 * 60 * 60 * 24)) };
    }).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3);
    
    list.innerHTML = upcoming.map(a => `
        <div class="countdown-item">
            <span class="name">${a.name}</span>
            <span class="days">还有 ${a.daysLeft} 天</span>
        </div>
    `).join('');
}

// 随机回忆
function showRandomMemory() {
    if (memories.length === 0) {
        alert('还没有记忆哦！');
        return;
    }
    
    const random = memories[Math.floor(Math.random() * memories.length)];
    const typeNames = { date: '约会', milestone: '里程碑', story: '故事', travel: '旅行' };
    
    let dateDisplay = random.dateRange 
        ? `${formatDate(random.dateRange.start)} - ${formatDate(random.dateRange.end)}`
        : formatDate(random.date);
    
    let locationDisplay = '';
    if (random.locations && random.locations.length > 0) {
        locationDisplay = `<p><strong>地点：</strong>${random.locations.map(l => l.name.split(',')[0]).join('、')}</p>`;
    } else if (random.location) {
        locationDisplay = `<p><strong>地点：</strong>${random.location.name.split(',')[0]}</p>`;
    }
    
    let photoDisplay = '';
    if (random.photos && random.photos.length > 0) {
        photoDisplay = `<div class="photo-gallery" style="margin-top:10px;">${random.photos.map(p => {
            if (p.startsWith('data:video/')) {
                return `<div class="photo-item"><video src="${p}" controls style="width:100%;height:100%;object-fit:cover;"></video></div>`;
            } else {
                return `<div class="photo-item"><img src="${p}" style="width:100%;height:100%;object-fit:cover;"></div>`;
            }
        }).join('')}</div>`;
    }
    
    document.getElementById('random-memory-content').innerHTML = `
        <p><strong>类型：</strong>${typeNames[random.type]}</p>
        <p><strong>日期：</strong>${dateDisplay}</p>
        ${locationDisplay}
        <p><strong>内容：</strong>${random.content}</p>
        ${photoDisplay}
    `;
    
    document.getElementById('random-memory-modal').style.display = 'flex';
}

// 照片墙
function renderPhotoWall() {
    const grid = document.getElementById('photo-wall-grid');
    const allPhotos = [];
    
    memories.forEach(m => {
        if (m.photos) {
            m.photos.forEach(p => allPhotos.push({ photo: p, date: m.date, content: m.content }));
        }
    });
    
    if (allPhotos.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#666;font-size:0.6rem;">还没有照片，快去添加记忆吧！</p>';
        return;
    }
    
    grid.innerHTML = allPhotos.map(p => {
        if (p.photo.startsWith('data:video/')) {
            return `
                <div class="photo-wall-item">
                    <video src="${p.photo}" alt="记忆视频" controls></video>
                </div>
            `;
        } else {
            return `
                <div class="photo-wall-item" onclick="showPhoto('${p.photo}')">
                    <img src="${p.photo}" alt="记忆照片">
                </div>
            `;
        }
    }).join('');
}

function showPhoto(src) {
    document.getElementById('photo-modal-img').src = src;
    document.getElementById('photo-modal').style.display = 'flex';
}

// 愿望清单
async function addWish() {
    const input = document.getElementById('wish-input');
    const text = input.value.trim();
    if (!text) return;
    
    const wishData = {
        text,
        completed: false
    };
    
    const result = await apiRequest('/wishes', 'POST', wishData);
    if (result) {
        await fetchAllData();
        input.value = '';
        showNotification('愿望添加成功！');
    }
}

function renderWishes() {
    const container = document.getElementById('wishlist-container');
    const completed = wishes.filter(w => w.completed).length;
    const pending = wishes.length - completed;
    
    document.getElementById('wish-completed').textContent = completed;
    document.getElementById('wish-pending').textContent = pending;
    
    if (wishes.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#666;font-size:0.6rem;">还没有愿望，快来添加吧！</p>';
        return;
    }
    
    container.innerHTML = wishes.sort((a, b) => a.completed - b.completed).map(w => `
        <div class="wish-item ${w.completed ? 'completed' : ''}">
            <div class="wish-checkbox ${w.completed ? 'checked' : ''}" onclick="toggleWish('${w.id}')">
                ${w.completed ? '✓' : ''}
            </div>
            <span class="wish-text">${w.text}</span>
            <button class="wish-delete" onclick="deleteWish('${w.id}')">×</button>
        </div>
    `).join('');
}

async function toggleWish(id) {
    const wish = wishes.find(w => w.id === id);
    if (wish) {
        const updatedWish = { ...wish, completed: !wish.completed };
        const result = await apiRequest(`/wishes/${id}`, 'PUT', updatedWish);
        if (result) {
            await fetchAllData();
        }
    }
}

async function deleteWish(id) {
    if (confirm('确定要删除这个愿望吗？')) {
        const result = await apiRequest(`/wishes/${id}`, 'DELETE');
        if (result) {
            await fetchAllData();
            showNotification('愿望已删除');
        }
    }
}

// 心情打卡
let editingMoodId = null;

async function saveMood() {
    if (!selectedMood) {
        alert('请选择今天的心情！');
        return;
    }
    
    const note = document.getElementById('mood-note').value.trim();
    const today = new Date().toISOString().split('T')[0];
    
    const moodData = {
        date: today,
        mood: selectedMood,
        note
    };
    
    if (editingMoodId) {
        // 修改现有心情
        const result = await apiRequest(`/moods/${editingMoodId}`, 'PUT', moodData);
        if (result) {
            await fetchAllData();
            editingMoodId = null;
            showNotification('心情修改成功！');
        }
    } else {
        // 检查今天是否已打卡
        const existingIndex = moods.findIndex(m => m.date === today);
        
        if (existingIndex !== -1) {
            const existingMood = moods[existingIndex];
            const result = await apiRequest(`/moods/${existingMood.id}`, 'PUT', moodData);
            if (result) {
                await fetchAllData();
            }
        } else {
            const result = await apiRequest('/moods', 'POST', moodData);
            if (result) {
                await fetchAllData();
            }
        }
        
        showNotification('心情保存成功！');
    }
    
    document.getElementById('mood-note').value = '';
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    selectedMood = null;
}

function editMood(id) {
    const mood = moods.find(m => m.id === id);
    if (!mood) {
        showNotification('心情记录不存在');
        return;
    }
    
    editingMoodId = id;
    selectedMood = mood.mood;
    document.getElementById('mood-note').value = mood.note || '';
    
    // 选中对应的心情按钮
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-mood') === mood.mood) {
            btn.classList.add('selected');
        }
    });
    
    showNotification('请修改心情记录');
}

async function deleteMood(id) {
    if (confirm('确定要删除这个心情记录吗？')) {
        const result = await apiRequest(`/moods/${id}`, 'DELETE');
        if (result) {
            await fetchAllData();
            showNotification('心情记录已删除');
        }
    }
}

function renderMoods() {
    const list = document.getElementById('mood-list');
    const chart = document.getElementById('mood-chart');
    
    const moodEmojis = { happy: '😊', love: '🥰', excited: '🤩', calm: '😌', sad: '😢', angry: '😤' };
    const moodValues = { happy: 5, love: 5, excited: 4, calm: 3, sad: 2, angry: 1 };
    
    // 渲染图表
    const last7 = moods.slice(-7);
    chart.innerHTML = last7.map(m => {
        const height = (moodValues[m.mood] / 5) * 100;
        return `<div class="mood-bar" style="height:${height}%;" title="${moodEmojis[m.mood]}"></div>`;
    }).join('');
    
    // 渲染列表
    if (moods.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#666;font-size:0.6rem;">还没有心情记录</p>';
        return;
    }
    
    list.innerHTML = moods.slice().reverse().slice(0, 10).map(m => `
        <div class="mood-item">
            <span class="emoji">${moodEmojis[m.mood]}</span>
            <div class="info">
                <div class="date">${formatDate(m.date)}</div>
                ${m.note ? `<div class="note">${m.note}</div>` : ''}
            </div>
            <div class="mood-actions">
                <button class="btn btn-edit" onclick="editMood('${m.id}')">修改</button>
                <button class="btn btn-delete" onclick="deleteMood('${m.id}')">删除</button>
            </div>
        </div>
    `).join('');
}

// 音乐控制
function toggleMusic() {
    const btn = document.getElementById('music-toggle');
    
    if (!bgMusic) {
        // 尝试使用邹沛沛的《沉溺》作为背景音乐
        // 由于版权保护，这里使用示例音频，用户可以自行替换为本地音频文件
        // 建议用户下载邹沛沛的《沉溺》后，将文件名改为"chenni.mp3"并放在项目根目录
        const musicSources = [
            'chenni.mp3', // 本地文件（推荐）
            'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' // 备用公共音乐
        ];
        
        // 尝试加载本地文件
        bgMusic = new Audio();
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
        
        // 尝试第一个源
        bgMusic.src = musicSources[0];
        
        // 如果加载失败，使用备用源
        bgMusic.onerror = function() {
            console.log('本地音乐文件未找到，使用备用音乐');
            bgMusic.src = musicSources[1];
        };
    }
    
    if (isMusicPlaying) {
        bgMusic.pause();
        btn.textContent = '🎵';
        btn.classList.remove('playing');
    } else {
        bgMusic.play().catch((error) => {
            console.error('音乐播放失败:', error);
            alert('音乐播放失败，请检查网络连接或确保已将邹沛沛的《沉溺》音频文件命名为"chenni.mp3"并放在项目根目录');
        });
        btn.textContent = '🔊';
        btn.classList.add('playing');
    }
    isMusicPlaying = !isMusicPlaying;
}

// 设置功能
function exportData() {
    const data = {
        memories,
        anniversaries,
        messages,
        wishes,
        moods,
        loveStartDate,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `love-memory-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('数据导出成功！');
}

async function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            console.log('开始读取导入文件...');
            const data = JSON.parse(event.target.result);
            console.log('文件解析成功，数据结构:', Object.keys(data));
            
            let importedCount = 0;
            let totalCount = 0;
            let failedCount = 0;
            
            // 计算总数据量
            if (data.memories) totalCount += data.memories.length;
            if (data.anniversaries) totalCount += data.anniversaries.length;
            if (data.messages) totalCount += data.messages.length;
            if (data.wishes) totalCount += data.wishes.length;
            if (data.moods) totalCount += data.moods.length;
            
            showNotification(`开始导入 ${totalCount} 条数据...`);
            console.log(`开始导入 ${totalCount} 条数据...`);
            
            // 导入记忆
            if (data.memories && data.memories.length > 0) {
                console.log(`导入记忆：${data.memories.length} 条`);
                for (let i = 0; i < data.memories.length; i++) {
                    const memory = data.memories[i];
                    try {
                        console.log(`导入记忆 ${i+1} 类型:`, memory.type);
                        
                        // 检查是否重复
                        const isDuplicate = memories.some(m => 
                            m.content === memory.content && 
                            m.date === memory.date && 
                            m.type === memory.type
                        );
                        
                        if (isDuplicate) {
                            console.log(`记忆 ${i+1}/${data.memories.length} 已存在，跳过导入`);
                            continue;
                        }
                        
                        // 移除可能导致问题的字段
                        const { id, createdAt, updatedAt, ...memoryData } = memory;
                        console.log(`记忆数据:`, JSON.stringify(memoryData, null, 2));
                        const result = await apiRequest('/memories', 'POST', memoryData);
                        if (result) {
                            importedCount++;
                            console.log(`记忆 ${i+1}/${data.memories.length} 导入成功`);
                        } else {
                            failedCount++;
                            console.error(`记忆 ${i+1}/${data.memories.length} 导入失败：无响应`);
                        }
                    } catch (err) {
                        failedCount++;
                        console.error(`记忆 ${i+1}/${data.memories.length} 导入失败:`, err);
                    }
                }
            }
            
            // 导入纪念日
            if (data.anniversaries && data.anniversaries.length > 0) {
                console.log(`导入纪念日：${data.anniversaries.length} 条`);
                for (let i = 0; i < data.anniversaries.length; i++) {
                    const anniversary = data.anniversaries[i];
                    try {
                        // 检查是否重复
                        const isDuplicate = anniversaries.some(a => 
                            a.name === anniversary.name && 
                            a.date === anniversary.date
                        );
                        
                        if (isDuplicate) {
                            console.log(`纪念日 ${i+1}/${data.anniversaries.length} 已存在，跳过导入`);
                            continue;
                        }
                        
                        const { id, createdAt, updatedAt, ...anniversaryData } = anniversary;
                        const result = await apiRequest('/anniversaries', 'POST', anniversaryData);
                        if (result) {
                            importedCount++;
                            console.log(`纪念日 ${i+1}/${data.anniversaries.length} 导入成功`);
                        } else {
                            failedCount++;
                            console.error(`纪念日 ${i+1}/${data.anniversaries.length} 导入失败：无响应`);
                        }
                    } catch (err) {
                        failedCount++;
                        console.error(`纪念日 ${i+1}/${data.anniversaries.length} 导入失败:`, err);
                    }
                }
            }
            
            // 导入留言
            if (data.messages && data.messages.length > 0) {
                console.log(`导入留言：${data.messages.length} 条`);
                for (let i = 0; i < data.messages.length; i++) {
                    const message = data.messages[i];
                    try {
                        // 检查是否重复
                        const isDuplicate = messages.some(m => 
                            m.content === message.content && 
                            m.mood === message.mood
                        );
                        
                        if (isDuplicate) {
                            console.log(`留言 ${i+1}/${data.messages.length} 已存在，跳过导入`);
                            continue;
                        }
                        
                        const { id, createdAt, updatedAt, ...messageData } = message;
                        const result = await apiRequest('/messages', 'POST', messageData);
                        if (result) {
                            importedCount++;
                            console.log(`留言 ${i+1}/${data.messages.length} 导入成功`);
                        } else {
                            failedCount++;
                            console.error(`留言 ${i+1}/${data.messages.length} 导入失败：无响应`);
                        }
                    } catch (err) {
                        failedCount++;
                        console.error(`留言 ${i+1}/${data.messages.length} 导入失败:`, err);
                    }
                }
            }
            
            // 导入愿望
            if (data.wishes && data.wishes.length > 0) {
                console.log(`导入愿望：${data.wishes.length} 条`);
                for (let i = 0; i < data.wishes.length; i++) {
                    const wish = data.wishes[i];
                    try {
                        console.log(`导入愿望 ${i+1}:`, wish.text);
                        
                        // 检查是否重复
                        const isDuplicate = wishes.some(w => 
                            w.text === wish.text
                        );
                        
                        if (isDuplicate) {
                            console.log(`愿望 ${i+1}/${data.wishes.length} 已存在，跳过导入`);
                            continue;
                        }
                        
                        // 移除可能导致问题的字段
                        const { id, createdAt, updatedAt, ...wishData } = wish;
                        console.log(`愿望数据:`, JSON.stringify(wishData, null, 2));
                        const result = await apiRequest('/wishes', 'POST', wishData);
                        if (result) {
                            importedCount++;
                            console.log(`愿望 ${i+1}/${data.wishes.length} 导入成功`);
                        } else {
                            failedCount++;
                            console.error(`愿望 ${i+1}/${data.wishes.length} 导入失败：无响应`);
                        }
                    } catch (err) {
                        failedCount++;
                        console.error(`愿望 ${i+1}/${data.wishes.length} 导入失败:`, err);
                    }
                }
            } else {
                console.log('没有愿望数据需要导入');
            }
            
            // 导入心情
            if (data.moods && data.moods.length > 0) {
                console.log(`导入心情：${data.moods.length} 条`);
                for (let i = 0; i < data.moods.length; i++) {
                    const mood = data.moods[i];
                    try {
                        // 检查是否重复
                        const isDuplicate = moods.some(m => 
                            m.date === mood.date
                        );
                        
                        if (isDuplicate) {
                            console.log(`心情 ${i+1}/${data.moods.length} 已存在，跳过导入`);
                            continue;
                        }
                        
                        const { id, createdAt, updatedAt, ...moodData } = mood;
                        const result = await apiRequest('/moods', 'POST', moodData);
                        if (result) {
                            importedCount++;
                            console.log(`心情 ${i+1}/${data.moods.length} 导入成功`);
                        } else {
                            failedCount++;
                            console.error(`心情 ${i+1}/${data.moods.length} 导入失败：无响应`);
                        }
                    } catch (err) {
                        failedCount++;
                        console.error(`心情 ${i+1}/${data.moods.length} 导入失败:`, err);
                    }
                }
            }
            
            // 导入恋爱开始日期
            if (data.loveStartDate) {
                loveStartDate = data.loveStartDate;
                localStorage.setItem('loveStartDate', loveStartDate);
                startLoveTimer();
                console.log('恋爱开始日期导入成功:', loveStartDate);
            }
            
            // 重新加载数据
            console.log('导入完成，重新加载数据...');
            await fetchAllData();
            console.log(`导入完成！成功: ${importedCount}, 失败: ${failedCount}, 总计: ${totalCount}`);
            showNotification(`导入完成！成功导入 ${importedCount} 条数据，失败 ${failedCount} 条（共 ${totalCount} 条）`);
        } catch (err) {
            console.error('导入失败:', err);
            showNotification(`导入失败：${err.message}`);
        }
    };
    reader.readAsText(file);
}

async function clearAllData() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        if (confirm('再次确认：所有记忆、纪念日、留言等数据都将被删除！')) {
            // 并行删除所有数据
            await Promise.all([
                apiRequest('/memories/clear', 'DELETE'),
                apiRequest('/anniversaries/clear', 'DELETE'),
                apiRequest('/messages/clear', 'DELETE'),
                apiRequest('/wishes/clear', 'DELETE'),
                apiRequest('/moods/clear', 'DELETE')
            ]);
            
            // 清空本地数据
            memories = [];
            anniversaries = [];
            messages = [];
            wishes = [];
            moods = [];
            
            // 重新渲染页面
            renderMemories();
            renderAnniversaries();
            renderCalendar();
            renderMessages();
            renderWishes();
            renderMoods();
            renderPhotoWall();
            renderCountdown();
            
            showNotification('所有数据已清除！');
        }
    }
}

// 地图状态检查
function checkMapStatus() {
    const statusDiv = document.getElementById('map-status');
    statusDiv.innerHTML = '<div class="loading"></div><p style="font-size:0.6rem;margin-top:10px;">检查中...</p>';
    
    setTimeout(() => {
        if (typeof BMap !== 'undefined') {
            statusDiv.innerHTML = '<p style="font-size:0.6rem;color:#27ae60;">✅ 百度地图API加载成功</p><p style="font-size:0.5rem;margin-top:5px;">可以正常搜索地点并获取详细信息</p>';
        } else {
            statusDiv.innerHTML = '<p style="font-size:0.6rem;color:#e74c3c;">❌ 百度地图API加载失败</p><p style="font-size:0.5rem;margin-top:5px;">原因可能是：<br>- 网络连接问题<br>- API密钥无效<br>- 浏览器限制</p><p style="font-size:0.5rem;margin-top:5px;">将使用手动地点添加模式</p>';
        }
    }, 1000);
}

// 地图初始化
function initMap() {
    if (typeof BMap === 'undefined') {
        document.getElementById('memory-map').innerHTML = '<p style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;">地图加载失败</p>';
        return;
    }
    
    if (memoryMap) memoryMap = null;
    
    memoryMap = new BMap.Map('memory-map');
    memoryMap.centerAndZoom(new BMap.Point(104.1954, 35.8617), 5);
    memoryMap.addControl(new BMap.NavigationControl());
    memoryMap.enableScrollWheelZoom(true);
    
    const points = [];
    memories.forEach(m => {
        const locations = m.locations || (m.location ? [m.location] : []);
        locations.forEach(loc => {
            if (loc && loc.lat && loc.lng) {
                const point = new BMap.Point(loc.lng, loc.lat);
                points.push(point);
                const marker = new BMap.Marker(point);
                memoryMap.addOverlay(marker);
                marker.addEventListener('click', function() {
                    alert(`${m.content.substring(0, 50)}\n日期：${formatDate(m.date)}`);
                });
            }
        });
    });
    
    if (points.length > 0) {
        memoryMap.setViewport(points);
    }
}

// 地点搜索
function searchLocation() {
    const query = document.getElementById('memory-location').value.trim();
    if (!query) return;
    
    if (typeof BMap === 'undefined') {
        useManualLocation(query);
        return;
    }
    
    const local = new BMap.LocalSearch(new BMap.Map(), {
        onSearchComplete: function(res) {
            if (local.getStatus() === BMAP_STATUS_SUCCESS && res.getNumPois() > 0) {
                const firstPoi = res.getPoi(0);
                // 构建完整的地点名称，包含城市信息
                let fullLocationName = firstPoi.title;
                if (firstPoi.address && !fullLocationName.includes(firstPoi.address)) {
                    fullLocationName += `, ${firstPoi.address}`;
                }
                addLocation({ 
                    name: fullLocationName, 
                    title: firstPoi.title, 
                    address: firstPoi.address, 
                    lat: firstPoi.point.lat, 
                    lng: firstPoi.point.lng 
                });
            } else {
                useManualLocation(query);
            }
        }
    });
    local.search(query);
}

function useManualLocation(name) {
    if (confirm(`确定要添加地点："${name}" 吗？`)) {
        addLocation({ name, lat: 35.8617, lng: 104.1954 });
    }
}

function addLocation(loc) {
    if (selectedLocations.some(l => l.name === loc.name)) {
        showNotification('该地点已添加');
        return;
    }
    selectedLocations.push(loc);
    renderSelectedLocations();
    document.getElementById('memory-location').value = '';
}

function removeLocation(index) {
    selectedLocations.splice(index, 1);
    renderSelectedLocations();
}

function renderSelectedLocations() {
    const container = document.getElementById('selected-locations');
    container.innerHTML = selectedLocations.map((loc, i) => `
        <div class="selected-location-tag">
            <span class="loc-name">${loc.name.split(',')[0]}</span>
            <button type="button" class="remove-loc" onclick="removeLocation(${i})">×</button>
        </div>
    `).join('');
}

// 标签功能
function addTag() {
    const input = document.getElementById('memory-tag');
    const tag = input.value.trim();
    if (!tag) return;
    
    if (selectedTags.includes(tag)) {
        showNotification('该标签已添加');
        return;
    }
    
    selectedTags.push(tag);
    renderSelectedTags();
    input.value = '';
}

function removeTag(index) {
    selectedTags.splice(index, 1);
    renderSelectedTags();
}

function renderSelectedTags() {
    const container = document.getElementById('selected-tags');
    container.innerHTML = selectedTags.map((tag, i) => `
        <div class="selected-tag">
            <span>${tag}</span>
            <button type="button" class="remove-tag" onclick="removeTag(${i})">×</button>
        </div>
    `).join('');
}

// 语音输入
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('浏览器不支持语音输入\n\n建议使用：\n• Google Chrome\n• Microsoft Edge\n• Mozilla Firefox');
        return;
    }
    
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        const btn = document.getElementById('voice-input-btn');
        const textarea = document.getElementById('memory-content');
        
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        btn.classList.add('recording');
        btn.textContent = '🔴';
        showNotification('请开始说话...');
        recognition.start();
        
        recognition.onresult = function(e) {
            const transcript = e.results[0][0].transcript;
            textarea.value += transcript;
            showNotification('语音输入成功！');
        };
        
        recognition.onend = function() {
            btn.classList.remove('recording');
            btn.textContent = '🎤';
        };
        
        recognition.onerror = function(event) {
            console.error('语音输入错误:', event.error);
            let errorMessage = '语音输入失败';
            
            switch(event.error) {
                case 'no-speech':
                    errorMessage = '没有检测到语音';
                    break;
                case 'audio-capture':
                    errorMessage = '无法访问麦克风';
                    break;
                case 'not-allowed':
                    errorMessage = '麦克风权限被拒绝';
                    break;
                case 'aborted':
                    errorMessage = '语音输入被中止';
                    break;
            }
            
            showNotification(errorMessage);
            btn.classList.remove('recording');
            btn.textContent = '🎤';
        };
    } catch (error) {
        console.error('语音输入初始化错误:', error);
        alert('语音输入初始化失败\n\n' + error.message);
        const btn = document.getElementById('voice-input-btn');
        btn.classList.remove('recording');
        btn.textContent = '🎤';
    }
}

// 语音留言
let voiceMessageRecorder = null;
let voiceMessageStream = null;
let voiceMessageChunks = [];

function startVoiceMessage() {
    if (!('MediaRecorder' in window) || !('navigator' in window) || !('mediaDevices' in navigator)) {
        alert('浏览器不支持语音录制\n\n建议使用：\n• Google Chrome\n• Microsoft Edge\n• Mozilla Firefox');
        return;
    }
    
    try {
        const btn = document.getElementById('voice-message-btn');
        
        // 如果已经在录制，停止录制
        if (btn.classList.contains('recording')) {
            if (voiceMessageRecorder && voiceMessageRecorder.state === 'recording') {
                voiceMessageRecorder.stop();
            }
            return;
        }
        
        btn.classList.add('recording');
        btn.textContent = '🔴';
        showNotification('请开始录制语音留言...');
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                voiceMessageStream = stream;
                
                // 检查浏览器支持的音频格式
                const options = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') 
                    ? { mimeType: 'audio/ogg;codecs=opus' } 
                    : MediaRecorder.isTypeSupported('audio/webm') 
                    ? { mimeType: 'audio/webm' } 
                    : {};
                
                voiceMessageRecorder = new MediaRecorder(stream, options);
                voiceMessageChunks = [];
                
                voiceMessageRecorder.start();
                
                voiceMessageRecorder.ondataavailable = function(e) {
                    if (e.data.size > 0) {
                        voiceMessageChunks.push(e.data);
                    }
                };
                
                voiceMessageRecorder.onstop = function() {
                    if (voiceMessageChunks.length > 0) {
                        const blob = new Blob(voiceMessageChunks, { 
                            type: voiceMessageRecorder.mimeType || 'audio/wav' 
                        });
                        const reader = new FileReader();
                        
                        reader.onload = function(e) {
                            const audioData = e.target.result;
                            // 在留言内容中添加音频标记
                            const textarea = document.getElementById('message-content');
                            textarea.value += '[语音留言] ';
                            
                            // 存储音频数据到localStorage
                            localStorage.setItem('voiceMessage_' + Date.now(), audioData);
                            showNotification('语音留言录制成功！');
                        };
                        
                        reader.readAsDataURL(blob);
                    } else {
                        showNotification('语音留言录制失败，没有录制到音频');
                    }
                    
                    // 清理资源
                    if (voiceMessageStream) {
                        voiceMessageStream.getTracks().forEach(track => track.stop());
                    }
                    btn.classList.remove('recording');
                    btn.textContent = '🎤';
                    voiceMessageRecorder = null;
                    voiceMessageStream = null;
                    voiceMessageChunks = [];
                };
                
                voiceMessageRecorder.onerror = function(error) {
                    console.error('MediaRecorder错误:', error);
                    showNotification('录音过程中出现错误');
                    
                    // 清理资源
                    if (voiceMessageStream) {
                        voiceMessageStream.getTracks().forEach(track => track.stop());
                    }
                    btn.classList.remove('recording');
                    btn.textContent = '🎤';
                    voiceMessageRecorder = null;
                    voiceMessageStream = null;
                    voiceMessageChunks = [];
                };
                
                // 30秒后自动停止录制
                setTimeout(() => {
                    if (voiceMessageRecorder && voiceMessageRecorder.state === 'recording') {
                        voiceMessageRecorder.stop();
                    }
                }, 30000);
            })
            .catch(error => {
                console.error('获取麦克风权限失败:', error);
                showNotification('无法访问麦克风');
                btn.classList.remove('recording');
                btn.textContent = '🎤';
            });
    } catch (error) {
        console.error('语音录制初始化错误:', error);
        alert('语音录制初始化失败\n\n' + error.message);
        const btn = document.getElementById('voice-message-btn');
        btn.classList.remove('recording');
        btn.textContent = '🎤';
    }
}

// 添加记忆
async function addMemory() {
    const type = document.getElementById('memory-type').value;
    const content = document.getElementById('memory-content').value.trim();
    const isRange = document.getElementById('date-range-toggle').checked;
    
    if (!content) {
        alert('请输入记忆内容');
        return;
    }
    
    let dateInfo;
    if (isRange) {
        const start = document.getElementById('memory-start-date').value;
        const end = document.getElementById('memory-end-date').value;
        if (!start || !end) {
            alert('请选择日期');
            return;
        }
        if (new Date(start) > new Date(end)) {
            alert('开始日期不能晚于结束日期');
            return;
        }
        dateInfo = { isRange: true, startDate: start, endDate: end, date: start };
    } else {
        const date = document.getElementById('memory-date').value;
        if (!date) {
            alert('请选择日期');
            return;
        }
        dateInfo = { isRange: false, date };
    }
    
    const memoryData = {
        type,
        content,
        date: dateInfo.date,
        dateRange: dateInfo.isRange ? { start: dateInfo.startDate, end: dateInfo.endDate } : null,
        locations: selectedLocations,
        photos: selectedPhotos.map(item => item.data || item),
        tags: selectedTags
    };
    
    const result = await apiRequest('/memories', 'POST', memoryData);
    if (result) {
        await fetchAllData();
        resetMemoryForm();
        showNotification('记忆添加成功！');
    }
}

async function updateMemory() {
    const type = document.getElementById('memory-type').value;
    const content = document.getElementById('memory-content').value.trim();
    const isRange = document.getElementById('date-range-toggle').checked;
    
    if (!content) {
        alert('请输入记忆内容');
        return;
    }
    
    let dateInfo;
    if (isRange) {
        const start = document.getElementById('memory-start-date').value;
        const end = document.getElementById('memory-end-date').value;
        if (!start || !end) {
            alert('请选择日期');
            return;
        }
        if (new Date(start) > new Date(end)) {
            alert('开始日期不能晚于结束日期');
            return;
        }
        dateInfo = { isRange: true, startDate: start, endDate: end, date: start };
    } else {
        const date = document.getElementById('memory-date').value;
        if (!date) {
            alert('请选择日期');
            return;
        }
        dateInfo = { isRange: false, date };
    }
    
    const memoryData = {
        type,
        content,
        date: dateInfo.date,
        dateRange: dateInfo.isRange ? { start: dateInfo.startDate, end: dateInfo.endDate } : null,
        locations: selectedLocations,
        photos: selectedPhotos.map(item => item.data || item),
        tags: selectedTags
    };
    
    const result = await apiRequest(`/memories/${editingMemoryId}`, 'PUT', memoryData);
    if (result) {
        editingMemoryId = null;
        await fetchAllData();
        resetMemoryForm();
        showNotification('记忆更新成功！');
    }
}

function resetMemoryForm() {
    document.getElementById('memory-form').reset();
    document.getElementById('memory-form-title').textContent = '添加新记忆';
    document.getElementById('memory-submit-btn').textContent = '保存记忆';
    document.getElementById('memory-id').value = '';
    selectedPhotos = [];
    selectedLocations = [];
    selectedTags = [];
    document.getElementById('selected-locations').innerHTML = '';
    document.getElementById('selected-tags').innerHTML = '';
    document.getElementById('single-date-container').style.display = 'block';
    document.getElementById('date-range-container').style.display = 'none';
    document.getElementById('date-range-toggle').checked = false;
    const gallery = document.querySelector('#photo-upload-container .photo-gallery');
    if (gallery) gallery.remove();
    document.getElementById('memory-date').valueAsDate = new Date();
}

function editMemory(id) {
    if (!id) {
        console.error('编辑记忆失败：ID不存在');
        showNotification('编辑失败：无效的记忆ID');
        return;
    }
    const memory = memories.find(m => m.id === id);
    if (!memory) {
        console.error('编辑记忆失败：记忆不存在');
        showNotification('编辑失败：记忆不存在');
        return;
    }
    
    editingMemoryId = id;
    console.log('开始编辑记忆：', id);
    document.getElementById('memory-form-title').textContent = '编辑记忆';
    document.getElementById('memory-submit-btn').textContent = '更新记忆';
    document.getElementById('memory-type').value = memory.type;
    document.getElementById('memory-content').value = memory.content;
    
    if (memory.dateRange) {
        document.getElementById('date-range-toggle').checked = true;
        document.getElementById('single-date-container').style.display = 'none';
        document.getElementById('date-range-container').style.display = 'block';
        document.getElementById('memory-start-date').value = memory.dateRange.start;
        document.getElementById('memory-end-date').value = memory.dateRange.end;
    } else {
        document.getElementById('date-range-toggle').checked = false;
        document.getElementById('single-date-container').style.display = 'block';
        document.getElementById('date-range-container').style.display = 'none';
        document.getElementById('memory-date').value = memory.date;
    }
    
    if (memory.locations && memory.locations.length > 0) {
        selectedLocations = [...memory.locations];
        renderSelectedLocations();
    } else if (memory.location) {
        selectedLocations = [memory.location];
        renderSelectedLocations();
    }
    
    if (memory.photos && memory.photos.length > 0) {
        selectedPhotos = [...memory.photos];
        renderSelectedPhotos();
    }
    
    if (memory.tags && memory.tags.length > 0) {
        selectedTags = [...memory.tags];
        renderSelectedTags();
    }
    
    showPage('add-memory');
}

async function deleteMemory(id) {
    if (!id) {
        console.error('删除记忆失败：ID不存在');
        showNotification('删除失败：无效的记忆ID');
        return;
    }
    if (confirm('确定要删除这个记忆吗？')) {
        console.log('删除记忆：', id);
        const result = await apiRequest(`/memories/${id}`, 'DELETE');
        if (result) {
            await fetchAllData();
            showNotification('记忆已删除');
        }
    }
}

function handlePhotoUpload(e) {
    const files = e.target.files;
    for (let file of files) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
        const reader = new FileReader();
        reader.onload = function(e) {
            selectedPhotos.push({ data: e.target.result, type: file.type });
            renderSelectedPhotos();
        };
        reader.readAsDataURL(file);
    }
}

function renderSelectedPhotos() {
    let gallery = document.querySelector('#photo-upload-container .photo-gallery');
    if (!gallery) {
        gallery = document.createElement('div');
        gallery.className = 'photo-gallery';
        document.getElementById('photo-upload-container').appendChild(gallery);
    }
    gallery.innerHTML = selectedPhotos.map((item, i) => {
        if (item.type && item.type.startsWith('video/')) {
            return `
                <div class="photo-item">
                    <video src="${item.data}" alt="视频" controls style="width:100%;height:100%;object-fit:cover;"></video>
                    <button class="delete-photo" onclick="deletePhoto(${i})">×</button>
                </div>
            `;
        } else {
            return `
                <div class="photo-item">
                    <img src="${item.data || item}" alt="照片">
                    <button class="delete-photo" onclick="deletePhoto(${i})">×</button>
                </div>
            `;
        }
    }).join('');
}

function deletePhoto(index) {
    selectedPhotos.splice(index, 1);
    renderSelectedPhotos();
}

// 渲染记忆列表
function renderMemories() {
    const list = document.getElementById('memories-list');
    if (memories.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#666;font-size:0.6rem;">还没有记忆</p>';
        return;
    }
    
    const typeNames = { date: '约会', milestone: '里程碑', story: '故事', travel: '旅行' };
    const sorted = [...memories].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = sorted.map(m => {
        const dateDisplay = m.dateRange 
            ? `${formatDate(m.dateRange.start)} - ${formatDate(m.dateRange.end)}`
            : formatDate(m.date);
        let locationDisplay = '';
        if (m.locations && m.locations.length > 0) {
            locationDisplay = `<p class="memory-location">📍 ${m.locations.map(l => l.name.split(',')[0]).join('、')}</p>`;
        } else if (m.location) {
            locationDisplay = `<p class="memory-location">📍 ${m.location.name.split(',')[0]}</p>`;
        }
        
        let tagDisplay = '';
        if (m.tags && m.tags.length > 0) {
            tagDisplay = `<div class="memory-tags">${m.tags.map(tag => `<span class="memory-tag">${tag}</span>`).join('')}</div>`;
        }
        
        let photoGallery = '';
        if (m.photos && m.photos.length > 0) {
            photoGallery = `<div class="photo-gallery">${m.photos.map(p => {
                if (p.startsWith('data:video/')) {
                    return `<div class="photo-item"><video src="${p}" alt="视频" controls style="width:100%;height:100%;object-fit:cover;"></video></div>`;
                } else {
                    return `<div class="photo-item"><img src="${p}" alt="照片"></div>`;
                }
            }).join('')}</div>`;
        }
        
        return `
            <div class="memory-item">
                <h3>${typeNames[m.type]}</h3>
                ${locationDisplay}
                ${tagDisplay}
                <p>${m.content}</p>
                ${photoGallery}
                <p class="date">${dateDisplay}</p>
                <div class="memory-actions">
                    <button class="btn btn-edit" onclick="editMemory('${m.id}')">修改</button>
                    <button class="btn btn-delete" onclick="deleteMemory('${m.id}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 纪念日功能
async function addAnniversary() {
    const name = document.getElementById('anniversary-name').value.trim();
    const date = document.getElementById('anniversary-date').value;
    const desc = document.getElementById('anniversary-description').value.trim();
    
    if (!name || !date) {
        alert('请输入名称和日期');
        return;
    }
    
    const anniversaryData = {
        name,
        date,
        description: desc
    };
    
    const result = await apiRequest('/anniversaries', 'POST', anniversaryData);
    if (result) {
        await fetchAllData();
        document.getElementById('anniversary-name').value = '';
        document.getElementById('anniversary-description').value = '';
        showNotification('纪念日添加成功！');
    }
}

async function updateAnniversary() {
    const name = document.getElementById('anniversary-name').value.trim();
    const date = document.getElementById('anniversary-date').value;
    const desc = document.getElementById('anniversary-description').value.trim();
    
    if (!name || !date) {
        alert('请输入名称和日期');
        return;
    }
    
    const anniversaryData = {
        name,
        date,
        description: desc
    };
    
    const result = await apiRequest(`/anniversaries/${editingAnniversaryId}`, 'PUT', anniversaryData);
    if (result) {
        editingAnniversaryId = null;
        await fetchAllData();
        resetAnniversaryForm();
        showNotification('纪念日更新成功！');
    }
}

function resetAnniversaryForm() {
    document.getElementById('anniversary-form').reset();
    document.getElementById('anniversary-form-title').textContent = '纪念日管理';
    document.getElementById('anniversary-submit-btn').textContent = '添加纪念日';
}

function editAnniversary(id) {
    if (!id) {
        console.error('编辑纪念日失败：ID不存在');
        showNotification('编辑失败：无效的纪念日ID');
        return;
    }
    const a = anniversaries.find(x => x.id === id);
    if (!a) {
        console.error('编辑纪念日失败：纪念日不存在');
        showNotification('编辑失败：纪念日不存在');
        return;
    }
    
    editingAnniversaryId = id;
    console.log('开始编辑纪念日：', id);
    document.getElementById('anniversary-form-title').textContent = '编辑纪念日';
    document.getElementById('anniversary-submit-btn').textContent = '更新纪念日';
    document.getElementById('anniversary-name').value = a.name;
    document.getElementById('anniversary-date').value = a.date;
    document.getElementById('anniversary-description').value = a.description || '';
}

async function deleteAnniversary(id) {
    if (confirm('确定要删除这个纪念日吗？')) {
        const result = await apiRequest(`/anniversaries/${id}`, 'DELETE');
        if (result) {
            await fetchAllData();
            showNotification('纪念日已删除');
        }
    }
}

function renderAnniversaries() {
    const list = document.getElementById('anniversaries-list');
    if (anniversaries.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#666;font-size:0.6rem;">还没有纪念日</p>';
        return;
    }
    
    const today = new Date();
    list.innerHTML = anniversaries.map(a => {
        const annivDate = new Date(a.date);
        annivDate.setFullYear(today.getFullYear());
        if (annivDate < today) annivDate.setFullYear(today.getFullYear() + 1);
        const daysLeft = Math.ceil((annivDate - today) / (1000 * 60 * 60 * 24));
        
        // 计算周年
        const startDate = new Date(a.date);
        const years = today.getFullYear() - startDate.getFullYear();
        const monthDiff = today.getMonth() - startDate.getMonth();
        const dayDiff = today.getDate() - startDate.getDate();
        
        let anniversaryText = '';
        if (years > 0) {
            if (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)) {
                anniversaryText = `<p class="anniversary-year">🎉 ${years}周年</p>`;
            } else {
                anniversaryText = `<p class="anniversary-year">🎉 ${years - 1}周年</p>`;
            }
        }
        
        return `
            <div class="anniversary-item">
                <h3>${a.name}</h3>
                <p class="date">${formatDate(a.date)}</p>
                ${anniversaryText}
                <p>${a.description || '无描述'}</p>
                <p class="days-left">距离今年还有 ${daysLeft} 天</p>
                <div class="anniversary-actions">
                    <button class="btn btn-edit" onclick="editAnniversary('${a.id}')">修改</button>
                    <button class="btn btn-delete" onclick="deleteAnniversary('${a.id}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 留言功能
async function addMessage() {
    const content = document.getElementById('message-content').value.trim();
    const mood = document.getElementById('message-mood').value;
    
    if (!content) {
        alert('请输入留言内容');
        return;
    }
    
    const moodNames = { love: '❤️ 爱你', miss: '💕 想你', happy: '😊 开心', thanks: '🙏 感谢', sorry: '😔 抱歉', other: '💭 其他' };
    
    const messageData = {
        content,
        mood: moodNames[mood],
        hasVoice: content.includes('[语音留言]')
    };
    
    const result = await apiRequest('/messages', 'POST', messageData);
    if (result) {
        await fetchAllData();
        document.getElementById('message-content').value = '';
        document.getElementById('message-mood').value = 'love';
        showNotification('留言发送成功！');
    }
}

function renderMessages() {
    const list = document.getElementById('messages-list');
    if (messages.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#666;font-size:0.6rem;">还没有留言</p>';
        return;
    }
    
    list.innerHTML = messages.slice().reverse().map(m => {
        const date = new Date(m.createdAt);
        const formatted = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="message-item">
                <div class="message-header"><span class="message-time">${formatted}</span></div>
                <div class="message-content">${m.content}</div>
                ${m.hasVoice ? '<audio controls style="width:100%;margin:10px 0;"><source src="" type="audio/wav">您的浏览器不支持音频播放。</audio>' : ''}
                <div class="message-mood">心情：${m.mood}</div>
                <div class="message-actions">
                    <button class="btn btn-delete" onclick="deleteMessage('${m.id}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteMessage(id) {
    if (confirm('确定要删除这条留言吗？')) {
        const result = await apiRequest(`/messages/${id}`, 'DELETE');
        if (result) {
            await fetchAllData();
            showNotification('留言已删除');
        }
    }
}

// 统计分析
function renderStats() {
    // 基本统计
    document.getElementById('total-memories').textContent = memories.length;
    
    // 计算总照片数
    const totalPhotos = memories.reduce((sum, m) => {
        return sum + (m.photos ? m.photos.length : 0);
    }, 0);
    document.getElementById('total-photos').textContent = totalPhotos;
    
    document.getElementById('total-anniversaries').textContent = anniversaries.length;
    document.getElementById('total-messages').textContent = messages.length;
    
    // 记忆类型分布
    const typeStats = memories.reduce((acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
        return acc;
    }, {});
    
    const typeNames = { date: '约会', milestone: '里程碑', story: '故事', travel: '旅行' };
    const typeChart = document.getElementById('memory-type-chart');
    
    if (Object.keys(typeStats).length === 0) {
        typeChart.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.6rem;">还没有记忆数据</p>';
    } else {
        typeChart.innerHTML = Object.entries(typeStats).map(([type, count]) => {
            const percentage = ((count / memories.length) * 100).toFixed(0);
            return `
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.6rem;">
                        <span style="color: var(--text-color);">${typeNames[type]}</span>
                        <span style="color: var(--accent-color); font-weight: bold;">${count} (${percentage}%)</span>
                    </div>
                    <div style="height: 10px; background-color: rgba(0,0,0,0.1); border-radius: 5px; overflow: hidden;">
                        <div style="height: 100%; width: ${percentage}%; background: linear-gradient(90deg, var(--primary-color), var(--accent-color)); border-radius: 5px; transition: width 0.5s ease;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 常去地点统计
    const locationStats = {};
    memories.forEach(m => {
        const locations = m.locations || (m.location ? [m.location] : []);
        locations.forEach(loc => {
            const locationName = loc.name.split(',')[0];
            locationStats[locationName] = (locationStats[locationName] || 0) + 1;
        });
    });
    
    const locationStatsEl = document.getElementById('location-stats');
    if (Object.keys(locationStats).length === 0) {
        locationStatsEl.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.6rem;">还没有地点数据</p>';
    } else {
        const sortedLocations = Object.entries(locationStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15); // 显示前15个地点
        
        locationStatsEl.innerHTML = sortedLocations.map(([name, count]) => `
            <div class="stats-list-item" style="padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.1); transition: background-color 0.2s ease;">
                <span class="item-name" style="font-size: 0.6rem; color: var(--text-color);">${name}</span>
                <span class="item-count" style="font-size: 0.6rem; color: var(--accent-color); font-weight: bold;">${count}次</span>
            </div>
        `).join('');
    }
    
    // 标签统计
    const tagStats = {};
    memories.forEach(m => {
        if (m.tags) {
            m.tags.forEach(tag => {
                tagStats[tag] = (tagStats[tag] || 0) + 1;
            });
        }
    });
    
    const tagStatsEl = document.getElementById('tag-stats');
    if (Object.keys(tagStats).length === 0) {
        tagStatsEl.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.6rem;">还没有标签数据</p>';
    } else {
        const sortedTags = Object.entries(tagStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15); // 显示前15个标签
        
        tagStatsEl.innerHTML = sortedTags.map(([tag, count]) => `
            <div class="stats-list-item" style="padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.1); transition: background-color 0.2s ease;">
                <span class="item-name" style="font-size: 0.6rem; color: var(--text-color);">${tag}</span>
                <span class="item-count" style="font-size: 0.6rem; color: var(--accent-color); font-weight: bold;">${count}次</span>
            </div>
        `).join('');
    }
    
    // 时间分布
    const timeDistribution = document.getElementById('time-distribution');
    if (memories.length === 0) {
        timeDistribution.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.6rem;">还没有记忆数据</p>';
    } else {
        // 按月份统计
        const monthlyStats = Array(12).fill(0);
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        
        memories.forEach(m => {
            const date = new Date(m.date);
            const month = date.getMonth();
            monthlyStats[month]++;
        });
        
        const maxCount = Math.max(...monthlyStats);
        
        timeDistribution.innerHTML = `
            <div style="width: 100%; height: 200px; display: flex; align-items: flex-end; justify-content: space-around; padding: 20px 0;">
                ${monthlyStats.map((count, index) => {
                    const height = count > 0 ? (count / maxCount) * 150 : 10;
                    return `
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; max-width: 40px;">
                            <div style="width: 25px; height: ${height}px; background: linear-gradient(180deg, var(--primary-color), var(--accent-color)); border-radius: 4px 4px 0 0; transition: height 0.5s ease;"></div>
                            <span style="font-size: 0.5rem; color: var(--text-color); text-align: center;">${monthNames[index]}</span>
                            <span style="font-size: 0.5rem; color: var(--accent-color); font-weight: bold;">${count}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

// AI助手
function sendAIQuery() {
    const query = document.getElementById('ai-query').value.trim();
    if (!query) return;
    
    const response = document.getElementById('ai-response');
    response.innerHTML = '<div class="loading"></div><p>分析中...</p>';
    
    setTimeout(() => {
        response.innerHTML = `<p>${getAIResponse(query)}</p>`;
        document.getElementById('ai-query').value = '';
    }, 1500);
}

function getAIResponse(query) {
    const total = memories.length;
    const totalAnniv = anniversaries.length;
    const allLocations = [];
    memories.forEach(m => {
        const locs = m.locations || (m.location ? [m.location] : []);
        locs.forEach(l => allLocations.push(l.name.split(',')[0]));
    });
    const locations = [...new Set(allLocations)];
    const types = memories.reduce((acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; }, {});
    
    if (query.includes('甜蜜') || query.includes('瞬间')) {
        if (total === 0) return '还没有记录任何记忆呢！快去添加一些甜蜜的瞬间吧！💕';
        const recent = memories.slice(-3).reverse();
        const typeNames = { date: '约会', milestone: '里程碑', story: '故事', travel: '旅行' };
        let resp = `根据你们的 ${total} 条记忆，我发现了这些甜蜜瞬间：\n\n`;
        recent.forEach((m, i) => {
            resp += `${i + 1}. ${typeNames[m.type]}：${m.content.substring(0, 30)}${m.content.length > 30 ? '...' : ''}\n`;
        });
        return resp + '\n继续记录更多美好时光吧！💝';
    }
    
    if (query.includes('历程') || query.includes('总结')) {
        if (total === 0) return '开始记录你们的恋爱历程吧！📝';
        const first = memories[0];
        let resp = `你们的恋爱历程：\n\n📅 从 ${formatDate(first.date)} 开始记录\n💝 共记录了 ${total} 条记忆\n💕 ${totalAnniv} 个重要纪念日\n`;
        if (locations.length > 0) resp += `🗺️ 去过 ${[...new Set(locations)].length} 个不同的地方\n`;
        return resp + '\n每一段旅程都见证了你们的爱情！✨';
    }
    
    if (query.includes('约会') || query.includes('推荐')) {
        // 预设的约会活动和地点
        const dateActivities = [
            '一起做手工DIY',
            '去看一场电影',
            '逛美术馆或博物馆',
            '一起做饭或烘焙',
            '去公园野餐',
            '骑自行车或散步',
            '去游乐场',
            '看一场音乐会或演出',
            '去书店或图书馆',
            '一起做运动（羽毛球、乒乓球等）'
        ];
        
        const datePlaces = [
            '温馨的咖啡厅',
            '环境优美的公园',
            '特色餐厅',
            '海边或湖边',
            '山顶或观景台',
            '主题展览',
            '特色街区或古镇',
            '温泉或SPA',
            '植物园或动物园',
            '创意园区'
        ];
        
        if (locations.length === 0) {
            // 随机推荐几个活动和地点
            const randomActivities = dateActivities.sort(() => 0.5 - Math.random()).slice(0, 3);
            const randomPlaces = datePlaces.sort(() => 0.5 - Math.random()).slice(0, 3);
            
            let resp = '推荐约会活动：\n\n';
            randomActivities.forEach((activity, i) => { resp += `${i + 1}. ${activity}\n`; });
            resp += '\n推荐约会地点：\n\n';
            randomPlaces.forEach((place, i) => { resp += `${i + 1}. ${place}\n`; });
            return resp + '\n💡 建议：根据天气和心情选择适合的活动，创造美好的回忆！';
        }
        
        const unique = [...new Set(locations)];
        let resp = `你们去过的地方：\n\n`;
        unique.slice(0, 3).forEach((l, i) => { resp += `${i + 1}. ${l}\n`; });
        
        // 推荐新的活动和地点
        const randomActivities = dateActivities.sort(() => 0.5 - Math.random()).slice(0, 3);
        const randomPlaces = datePlaces.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        resp += '\n推荐尝试的活动：\n\n';
        randomActivities.forEach((activity, i) => { resp += `${i + 1}. ${activity}\n`; });
        
        resp += '\n推荐探索的新地点：\n\n';
        randomPlaces.forEach((place, i) => { resp += `${i + 1}. ${place}\n`; });
        
        return resp + '\n💡 建议：偶尔尝试不同的约会方式，可以让感情更加新鲜有趣！';
    }
    
    if (query.includes('爱好') || query.includes('共同')) {
        if (total === 0) return '记录更多记忆后，我可以帮你们分析共同爱好哦！❤️';
        let resp = `根据你们的记忆分析：\n\n`;
        Object.entries(types).forEach(([type, count]) => {
            const typeNames = { date: '约会', milestone: '里程碑', story: '故事', travel: '旅行' };
            resp += `${typeNames[type]}：${count} 次\n`;
        });
        const favorite = Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b);
        const favName = { date: '约会', milestone: '里程碑', story: '故事', travel: '旅行' }[favorite];
        return resp + `\n你们最喜欢一起做的事情是${favName}！继续保持这份热情吧！💕`;
    }
    
    return `你们已经记录了 ${total} 条记忆和 ${totalAnniv} 个纪念日。\n\n我可以帮你：\n• 分析最甜蜜的瞬间\n• 总结恋爱历程\n• 推荐约会地点\n• 分析共同爱好\n\n试试点击上方的快捷按钮吧！`;
}

// 日历功能
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    document.getElementById('current-month').textContent = `${currentDate.getFullYear()}年 ${monthNames[currentDate.getMonth()]}`;
    calendar.innerHTML = '';
    
    ['日', '一', '二', '三', '四', '五', '六'].forEach(d => {
        calendar.innerHTML += `<div class="calendar-header">${d}</div>`;
    });
    
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = firstDay.getDay();
    
    for (let i = startDay - 1; i >= 0; i--) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), -i);
        calendar.innerHTML += createDayElement(d, true);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        calendar.innerHTML += createDayElement(d, false);
    }
    
    const remaining = 42 - (startDay + lastDay.getDate());
    for (let i = 1; i <= remaining; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
        calendar.innerHTML += createDayElement(d, true);
    }
}

function createDayElement(date, isOtherMonth) {
    const today = new Date();
    const dateStr = getLocalDateString(date);
    const hasMemory = memories.some(m => m.date === dateStr);
    const hasAnniv = anniversaries.some(a => {
        const ad = new Date(a.date);
        return ad.getMonth() === date.getMonth() && ad.getDate() === date.getDate();
    });
    
    let classes = 'calendar-day';
    if (isOtherMonth) classes += ' other-month';
    if (date.toDateString() === today.toDateString()) classes += ' today';
    if (hasMemory) classes += ' has-memory';
    if (hasAnniv) classes += ' has-anniversary';
    
    return `<div class="${classes}" onclick="showDayInfo('${dateStr}')">${date.getDate()}</div>`;
}

function showDayInfo(dateStr) {
    const dayMemories = memories.filter(m => m.date === dateStr);
    const dayAnnivs = anniversaries.filter(a => {
        const ad = new Date(a.date);
        const td = new Date(dateStr);
        return ad.getMonth() === td.getMonth() && ad.getDate() === td.getDate();
    });
    
    let msg = `日期：${formatDate(dateStr)}\n\n`;
    if (dayAnnivs.length > 0) {
        msg += '纪念日：\n';
        dayAnnivs.forEach(a => msg += `- ${a.name}\n`);
        msg += '\n';
    }
    if (dayMemories.length > 0) {
        msg += '记忆：\n';
        dayMemories.forEach(m => msg += `- ${m.content.substring(0, 30)}\n`);
    } else {
        msg += '这一天还没有记忆！';
    }
    alert(msg);
}

// 辅助函数
function getLocalDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function showNotification(msg) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}