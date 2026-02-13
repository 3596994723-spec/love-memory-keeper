# 恋爱记忆记录器

一个温馨的恋爱记忆记录应用，采用像素游戏风格设计。

## 功能特点

- ✨ **添加记忆** - 记录新的恋爱记忆，支持日期范围、地点、照片、语音输入
- 📅 **记忆日历** - 查看日历和记忆标记
- 🗺️ **记忆地图** - 查看我们去过的地方（百度地图）
- 💕 **纪念日管理** - 添加和管理重要纪念日
- 🤖 **智能助手** - AI分析甜蜜瞬间
- 💝 **我的记忆** - 查看所有记忆记录
- 💌 **甜蜜留言** - 互相留言表达爱意

## 技术栈

- HTML5
- CSS3 (像素游戏风格)
- JavaScript (原生)
- 百度地图API
- LocalStorage (本地存储)

## Gitee Pages 部署步骤

### 第一步：注册Gitee账号

1. 访问 [gitee.com](https://gitee.com)
2. 点击"注册"，填写信息完成注册

### 第二步：创建仓库

1. 登录Gitee后，点击右上角 **"+"** → **"新建仓库"**
2. 填写仓库信息：
   - 仓库名称：`love-memory-keeper`
   - 仓库介绍：恋爱记忆记录器
   - 选择 **"公开"**（私有仓库需要付费才能用Pages）
3. 点击 **"创建"**

### 第三步：上传文件

1. 在创建好的仓库页面，点击 **"上传文件"**
2. 将以下文件全部拖拽上传：
   - `index.html`
   - `style.css`
   - `script.js`
   - `vercel.json`
   - `README.md`
   - `.gitignore`
3. 填写提交信息：`Initial commit`
4. 点击 **"提交"**

### 第四步：开启Gitee Pages

1. 进入仓库页面
2. 点击顶部菜单 **"服务"** → **"Gitee Pages"**
3. 部署分支选择 **"master"**，目录选择 **"根目录"**
4. 点击 **"启动"** 或 **"更新"**
5. 等待几秒钟，页面会显示访问链接

### 第五步：访问网站

Gitee Pages 会给你一个访问链接，格式如：
```
https://你的用户名.gitee.io/love-memory-keeper
```

点击链接即可访问你的恋爱记忆记录器！

## 本地运行

直接用浏览器打开 `index.html` 文件即可。

或者使用本地服务器：

```bash
# 使用 Python
python -m http.server 8080

# 使用 Node.js
npx http-server
```

然后访问 http://localhost:8080

## 百度地图配置

项目使用百度地图API，当前已配置API Key。如需更换：

1. 访问 [百度地图开放平台](https://lbsyun.baidu.com/)
2. 注册并创建应用获取 API Key
3. 在 `index.html` 中替换 API Key：
```html
<script src="https://api.map.baidu.com/api?v=2.0&ak=你的API_KEY"></script>
```

## 数据存储

所有数据存储在浏览器的 LocalStorage 中，包括：
- 记忆记录
- 纪念日
- 留言

⚠️ **注意**：清除浏览器数据会导致数据丢失，请注意备份。

## 文件说明

| 文件 | 说明 |
|------|------|
| index.html | 主页面 |
| style.css | 样式文件 |
| script.js | 脚本文件 |
| vercel.json | Vercel配置（备用） |
| README.md | 说明文档 |
| .gitignore | Git忽略文件 |

## 许可证

MIT License