const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/auth');
const memoryRoutes = require('./routes/memories');
const anniversaryRoutes = require('./routes/anniversaries');
const messageRoutes = require('./routes/messages');
const wishRoutes = require('./routes/wishes');
const moodRoutes = require('./routes/moods');

// 初始化应用
const app = express();

// 连接数据库
connectDB();

// 中间件
app.use(cors({
  origin: 'https://3596994723-spec.github.io'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/anniversaries', anniversaryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wishes', wishRoutes);
app.use('/api/moods', moodRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ message: '恋爱记忆记录器后端服务' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '请求的资源不存在' });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
