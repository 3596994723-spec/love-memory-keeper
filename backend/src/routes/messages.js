const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { getDbConnected } = require('../config/database');
const memoryStorage = require('../config/memoryStorage');

// 获取所有留言
router.get('/', async (req, res) => {
  try {
    if (getDbConnected()) {
      const messages = await Message.find().sort({ createdAt: -1 });
      res.json(messages);
    } else {
      // 使用内存存储
      const messages = memoryStorage.getAll('messages');
      res.json(messages);
    }
  } catch (error) {
    console.error('获取留言错误:', error);
    // 发生错误时使用内存存储
    const messages = memoryStorage.getAll('messages');
    res.json(messages);
  }
});

// 创建新留言
router.post('/', async (req, res) => {
  try {
    if (getDbConnected()) {
      const message = await Message.create(req.body);
      res.status(201).json(message);
    } else {
      // 使用内存存储
      const message = memoryStorage.create('messages', req.body);
      res.status(201).json(message);
    }
  } catch (error) {
    console.error('创建留言错误:', error);
    // 发生错误时使用内存存储
    const message = memoryStorage.create('messages', req.body);
    res.status(201).json(message);
  }
});

// 删除留言
router.delete('/:id', async (req, res) => {
  try {
    if (getDbConnected()) {
      await Message.findByIdAndDelete(req.params.id);
      res.json({ message: '留言删除成功' });
    } else {
      // 使用内存存储
      const result = memoryStorage.delete('messages', req.params.id);
      if (!result) {
        return res.status(404).json({ message: '留言不存在' });
      }
      res.json({ message: '留言删除成功' });
    }
  } catch (error) {
    console.error('删除留言错误:', error);
    // 发生错误时使用内存存储
    const result = memoryStorage.delete('messages', req.params.id);
    res.json({ message: '留言删除成功' });
  }
});

// 清空所有留言
router.delete('/clear', async (req, res) => {
  try {
    if (getDbConnected()) {
      await Message.deleteMany({});
      res.json({ message: '所有留言已清除' });
    } else {
      // 使用内存存储
      const result = memoryStorage.clear('messages');
      res.json(result);
    }
  } catch (error) {
    console.error('清空留言错误:', error);
    // 发生错误时使用内存存储
    const result = memoryStorage.clear('messages');
    res.json(result);
  }
});

module.exports = router;
