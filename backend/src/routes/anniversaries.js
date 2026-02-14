const express = require('express');
const router = express.Router();
const Anniversary = require('../models/Anniversary');
const { getDbConnected } = require('../config/database');
const memoryStorage = require('../config/memoryStorage');

// 获取所有纪念日
router.get('/', async (req, res) => {
  try {
    if (getDbConnected()) {
      const anniversaries = await Anniversary.find().sort({ date: 1 });
      res.json(anniversaries);
    } else {
      // 使用内存存储
      const anniversaries = memoryStorage.getAll('anniversaries');
      res.json(anniversaries);
    }
  } catch (error) {
    console.error('获取纪念日错误:', error);
    // 发生错误时使用内存存储
    const anniversaries = memoryStorage.getAll('anniversaries');
    res.json(anniversaries);
  }
});

// 创建新纪念日
router.post('/', async (req, res) => {
  try {
    if (getDbConnected()) {
      const anniversary = await Anniversary.create(req.body);
      res.status(201).json(anniversary);
    } else {
      // 使用内存存储
      const anniversary = memoryStorage.create('anniversaries', req.body);
      res.status(201).json(anniversary);
    }
  } catch (error) {
    console.error('创建纪念日错误:', error);
    // 发生错误时使用内存存储
    const anniversary = memoryStorage.create('anniversaries', req.body);
    res.status(201).json(anniversary);
  }
});

// 更新纪念日
router.put('/:id', async (req, res) => {
  try {
    if (getDbConnected()) {
      const anniversary = await Anniversary.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!anniversary) {
        return res.status(404).json({ message: '纪念日不存在' });
      }
      res.json(anniversary);
    } else {
      // 使用内存存储
      const anniversary = memoryStorage.update('anniversaries', req.params.id, req.body);
      if (!anniversary) {
        return res.status(404).json({ message: '纪念日不存在' });
      }
      res.json(anniversary);
    }
  } catch (error) {
    console.error('更新纪念日错误:', error);
    // 发生错误时使用内存存储
    const anniversary = memoryStorage.update('anniversaries', req.params.id, req.body);
    if (!anniversary) {
      return res.status(404).json({ message: '纪念日不存在' });
    }
    res.json(anniversary);
  }
});

// 删除纪念日
router.delete('/:id', async (req, res) => {
  try {
    if (getDbConnected()) {
      const anniversary = await Anniversary.findByIdAndDelete(req.params.id);
      if (!anniversary) {
        return res.status(404).json({ message: '纪念日不存在' });
      }
      res.json({ message: '纪念日删除成功' });
    } else {
      // 使用内存存储
      const result = memoryStorage.delete('anniversaries', req.params.id);
      if (!result) {
        return res.status(404).json({ message: '纪念日不存在' });
      }
      res.json({ message: '纪念日删除成功' });
    }
  } catch (error) {
    console.error('删除纪念日错误:', error);
    // 发生错误时使用内存存储
    const result = memoryStorage.delete('anniversaries', req.params.id);
    if (!result) {
      return res.status(404).json({ message: '纪念日不存在' });
    }
    res.json({ message: '纪念日删除成功' });
  }
});

// 清空所有纪念日
router.delete('/clear', async (req, res) => {
  try {
    if (getDbConnected()) {
      await Anniversary.deleteMany({});
      res.json({ message: '所有纪念日已清除' });
    } else {
      // 使用内存存储
      const result = memoryStorage.clear('anniversaries');
      res.json(result);
    }
  } catch (error) {
    console.error('清空纪念日错误:', error);
    // 发生错误时使用内存存储
    const result = memoryStorage.clear('anniversaries');
    res.json(result);
  }
});

module.exports = router;
