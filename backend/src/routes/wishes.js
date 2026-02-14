const express = require('express');
const router = express.Router();
const Wish = require('../models/Wish');
const { getDbConnected } = require('../config/database');
const memoryStorage = require('../config/memoryStorage');

// 获取所有愿望
router.get('/', async (req, res) => {
  try {
    if (getDbConnected()) {
      const wishes = await Wish.find().sort({ createdAt: -1 });
      res.json(wishes);
    } else {
      // 使用内存存储
      const wishes = memoryStorage.getAll('wishes');
      res.json(wishes);
    }
  } catch (error) {
    console.error('获取愿望错误:', error);
    // 发生错误时使用内存存储
    const wishes = memoryStorage.getAll('wishes');
    res.json(wishes);
  }
});

// 创建新愿望
router.post('/', async (req, res) => {
  try {
    if (getDbConnected()) {
      const wish = await Wish.create(req.body);
      res.status(201).json(wish);
    } else {
      // 使用内存存储
      const wish = memoryStorage.create('wishes', req.body);
      res.status(201).json(wish);
    }
  } catch (error) {
    console.error('创建愿望错误:', error);
    // 发生错误时使用内存存储
    const wish = memoryStorage.create('wishes', req.body);
    res.status(201).json(wish);
  }
});

// 更新愿望
router.put('/:id', async (req, res) => {
  try {
    if (getDbConnected()) {
      const wish = await Wish.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      res.json(wish);
    } else {
      // 使用内存存储
      const wish = memoryStorage.update('wishes', req.params.id, req.body);
      res.json(wish);
    }
  } catch (error) {
    console.error('更新愿望错误:', error);
    // 发生错误时使用内存存储
    const wish = memoryStorage.update('wishes', req.params.id, req.body);
    res.json(wish);
  }
});

// 删除愿望
router.delete('/:id', async (req, res) => {
  try {
    if (getDbConnected()) {
      await Wish.findByIdAndDelete(req.params.id);
      res.json({ message: '愿望删除成功' });
    } else {
      // 使用内存存储
      const result = memoryStorage.delete('wishes', req.params.id);
      res.json({ message: '愿望删除成功' });
    }
  } catch (error) {
    console.error('删除愿望错误:', error);
    // 发生错误时使用内存存储
    const result = memoryStorage.delete('wishes', req.params.id);
    res.json({ message: '愿望删除成功' });
  }
});

// 清空所有愿望
router.delete('/clear', async (req, res) => {
  try {
    if (getDbConnected()) {
      await Wish.deleteMany({});
      res.json({ message: '所有愿望已清除' });
    } else {
      // 使用内存存储
      const result = memoryStorage.clear('wishes');
      res.json(result);
    }
  } catch (error) {
    console.error('清空愿望错误:', error);
    // 发生错误时使用内存存储
    const result = memoryStorage.clear('wishes');
    res.json(result);
  }
});

module.exports = router;
