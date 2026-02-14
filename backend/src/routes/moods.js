const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const { getDbConnected } = require('../config/database');
const memoryStorage = require('../config/memoryStorage');

// 获取所有心情
router.get('/', async (req, res) => {
  try {
    if (getDbConnected()) {
      const moods = await Mood.find().sort({ date: -1 });
      res.json(moods);
    } else {
      // 使用内存存储
      const moods = memoryStorage.getAll('moods');
      res.json(moods);
    }
  } catch (error) {
    console.error('获取心情错误:', error);
    // 发生错误时使用内存存储
    const moods = memoryStorage.getAll('moods');
    res.json(moods);
  }
});

// 创建新心情
router.post('/', async (req, res) => {
  try {
    if (getDbConnected()) {
      const mood = await Mood.create(req.body);
      res.status(201).json(mood);
    } else {
      // 使用内存存储
      const mood = memoryStorage.create('moods', req.body);
      res.status(201).json(mood);
    }
  } catch (error) {
    console.error('创建心情错误:', error);
    // 发生错误时使用内存存储
    const mood = memoryStorage.create('moods', req.body);
    res.status(201).json(mood);
  }
});

// 更新心情
router.put('/:id', async (req, res) => {
  try {
    if (getDbConnected()) {
      const mood = await Mood.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      res.json(mood);
    } else {
      // 使用内存存储
      const mood = memoryStorage.update('moods', req.params.id, req.body);
      res.json(mood);
    }
  } catch (error) {
    console.error('更新心情错误:', error);
    // 发生错误时使用内存存储
    const mood = memoryStorage.update('moods', req.params.id, req.body);
    res.json(mood);
  }
});

// 删除心情
router.delete('/:id', async (req, res) => {
  try {
    if (getDbConnected()) {
      await Mood.findByIdAndDelete(req.params.id);
      res.json({ message: '心情删除成功' });
    } else {
      // 使用内存存储
      const result = memoryStorage.delete('moods', req.params.id);
      res.json({ message: '心情删除成功' });
    }
  } catch (error) {
    console.error('删除心情错误:', error);
    // 发生错误时使用内存存储
    const result = memoryStorage.delete('moods', req.params.id);
    res.json({ message: '心情删除成功' });
  }
});

// 清空所有心情
router.delete('/clear', async (req, res) => {
  try {
    if (getDbConnected()) {
      await Mood.deleteMany({});
      res.json({ message: '所有心情已清除' });
    } else {
      // 使用内存存储
      const result = memoryStorage.clear('moods');
      res.json(result);
    }
  } catch (error) {
    console.error('清空心情错误:', error);
    // 发生错误时使用内存存储
    const result = memoryStorage.clear('moods');
    res.json(result);
  }
});

module.exports = router;
