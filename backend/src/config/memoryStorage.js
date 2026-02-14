// 内存存储模块，用于在数据库连接失败时提供临时存储

class MemoryStorage {
  constructor() {
    this.storages = {
      memories: [],
      anniversaries: [],
      messages: [],
      wishes: [],
      moods: []
    };
    this.counters = {
      memories: 1,
      anniversaries: 1,
      messages: 1,
      wishes: 1,
      moods: 1
    };
  }

  // 获取所有数据
  getAll(collection) {
    return this.storages[collection] || [];
  }

  // 创建新数据
  create(collection, data) {
    const id = `memory-${collection}-${this.counters[collection]++}`;
    const newData = {
      ...data,
      _id: id,
      id: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.storages[collection].push(newData);
    return newData;
  }

  // 更新数据
  update(collection, id, data) {
    const index = this.storages[collection].findIndex(item => item._id === id);
    if (index === -1) return null;
    
    this.storages[collection][index] = {
      ...this.storages[collection][index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    return this.storages[collection][index];
  }

  // 删除数据
  delete(collection, id) {
    const index = this.storages[collection].findIndex(item => item._id === id);
    if (index === -1) return null;
    
    this.storages[collection].splice(index, 1);
    return { message: '删除成功' };
  }

  // 清空所有数据
  clear(collection) {
    this.storages[collection] = [];
    return { message: `所有${collection}已清除` };
  }
}

module.exports = new MemoryStorage();