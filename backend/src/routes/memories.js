const express = require('express');
const router = express.Router();
const Memory = require('../models/Memory');
const { getDbConnected } = require('../config/database');
const memoryStorage = require('../config/memoryStorage');

// 获取所有记忆
router.get('/', async (req, res) => {
  try {
    if (getDbConnected()) {
      const memories = await Memory.find().sort({ createdAt: -1 });
      res.json(memories);
    } else {
      // 使用内存存储
      const memories = memoryStorage.getAll('memories');
      res.json(memories);
    }
  } catch (error) {
    console.error('获取记忆错误:', error);
    // 发生错误时使用内存存储
    const memories = memoryStorage.getAll('memories');
    res.json(memories);
  }
});

// 创建新记忆
router.post('/', async (req, res) => {
  try {
    if (getDbConnected()) {
      const memory = await Memory.create(req.body);
      res.status(201).json(memory);
    } else {
      // 使用内存存储
      const memory = memoryStorage.create('memories', req.body);
      res.status(201).json(memory);
    }
  } catch (error) {
    console.error('创建记忆错误:', error);
    // 发生错误时使用内存存储
    const memory = memoryStorage.create('memories', req.body);
    res.status(201).json(memory);
  }
});

// 更新记忆
router.put('/:id', async (req, res) => {
  try {
    console.log('更新记忆请求:', req.params.id, req.body);
    if (getDbConnected()) {
      const memory = await Memory.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!memory) {
        return res.status(404).json({ message: '记忆不存在' });
      }
      console.log('记忆更新成功:', req.params.id);
      res.json(memory);
    } else {
      // 使用内存存储
      const memory = memoryStorage.update('memories', req.params.id, req.body);
      if (!memory) {
        return res.status(404).json({ message: '记忆不存在' });
      }
      console.log('记忆更新成功(内存存储):', req.params.id);
      res.json(memory);
    }
  } catch (error) {
    console.error('更新记忆错误:', error);
    // 发生错误时使用内存存储
    const memory = memoryStorage.update('memories', req.params.id, req.body);
    if (!memory) {
      return res.status(404).json({ message: '记忆不存在' });
    }
    res.json(memory);
  }
});

// 删除记忆
router.delete('/:id', async (req, res) => {
  try {
    console.log('删除记忆请求:', req.params.id);
    if (getDbConnected()) {
      const memory = await Memory.findByIdAndDelete(req.params.id);
      if (!memory) {
        return res.status(404).json({ message: '记忆不存在' });
      }
      console.log('记忆删除成功:', req.params.id);
      res.json({ message: '记忆删除成功' });
    } else {
      // 使用内存存储
      const result = memoryStorage.delete('memories', req.params.id);
      if (!result) {
        return res.status(404).json({ message: '记忆不存在' });
      }
      console.log('记忆删除成功(内存存储):', req.params.id);
      res.json({ message: '记忆删除成功' });
    }
  } catch (error) {
    console.error('删除记忆错误:', error);
    // 发生错误时使用内存存储
    const result = memoryStorage.delete('memories', req.params.id);
    if (!result) {
      return res.status(404).json({ message: '记忆不存在' });
    }
    res.json({ message: '记忆删除成功' });
  }
});

// 清空所有记忆
router.delete('/clear', async (req, res) => {
  try {
    if (getDbConnected()) {
      await Memory.deleteMany({});
      res.json({ message: '所有记忆已清除' });
    } else {
      // 使用内存存储
      const result = memoryStorage.clear('memories');
      res.json(result);
    }
  } catch (error) {
    console.error('清空记忆错误:', error);
    // 发生错误时使用内存存储
    const result = memoryStorage.clear('memories');
    res.json(result);
  }
});

module.exports = router;
