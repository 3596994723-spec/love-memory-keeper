const mongoose = require('mongoose');
require('dotenv').config();

let dbConnected = false;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('数据库连接成功');
    dbConnected = true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    console.log('将使用内存存储模式运行');
    dbConnected = false;
  }
};

module.exports = {
  connectDB,
  getDbConnected: () => dbConnected
};
