/**
 * 区块链存储模块
 * 负责区块链数据的持久化存储和读取
 */
import { Level } from 'level';
import path from 'path';
import fs from 'fs';
import { Blockchain } from '../blockchain/blockchain.js';
import { Block } from '../blockchain/block.js';
import { Transaction } from '../blockchain/transaction.js';

/**
 * 区块链存储类
 * 使用LevelDB存储区块链数据
 */
export class BlockchainStorage {
  /**
   * 创建区块链存储实例
   * @param {string} dbPath - 数据库路径
   */
  constructor(dbPath = './data/blockchain') {
    // 确保数据目录存在
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 初始化LevelDB
    this.db = new Level(dbPath, { valueEncoding: 'json' });
  }

  /**
   * 保存区块链
   * @param {Blockchain} blockchain - 要保存的区块链
   * @returns {Promise} - 保存操作的Promise
   */
  async saveBlockchain(blockchain) {
    try {
      // 保存区块链元数据
      await this.db.put('metadata', {
        difficulty: blockchain.difficulty,
        miningReward: blockchain.miningReward,
        chainLength: blockchain.chain.length
      });
      
      // 保存每个区块
      for (let i = 0; i < blockchain.chain.length; i++) {
        const block = blockchain.chain[i];
        await this.db.put(`block_${i}`, block.toJSON());
      }
      
      // 保存待处理交易
      await this.db.put('pendingTransactions', 
        blockchain.pendingTransactions.map(tx => tx.toJSON())
      );
      
      console.log('区块链数据保存成功');
      return true;
    } catch (error) {
      console.error('保存区块链失败:', error);
      throw error;
    }
  }

  /**
   * 加载区块链
   * @returns {Promise<Blockchain>} - 加载的区块链
   */
  async loadBlockchain() {
    try {
      // 检查数据库是否为空
      let isEmpty = true;
      try {
        await this.db.get('metadata');
        isEmpty = false;
      } catch (error) {
        if (error.code !== 'LEVEL_NOT_FOUND') {
          throw error;
        }
      }
      
      // 如果数据库为空，返回新的区块链
      if (isEmpty) {
        console.log('数据库为空，创建新的区块链');
        return new Blockchain();
      }
      
      // 加载区块链元数据
      const metadata = await this.db.get('metadata');
      const blockchain = new Blockchain(metadata.difficulty, metadata.miningReward);
      
      // 清空初始链（移除创世区块）
      blockchain.chain = [];
      
      // 加载每个区块
      for (let i = 0; i < metadata.chainLength; i++) {
        const blockData = await this.db.get(`block_${i}`);
        const block = Block.fromJSON(blockData, txData => Transaction.fromJSON(txData));
        blockchain.chain.push(block);
      }
      
      // 加载待处理交易
      try {
        const pendingTxs = await this.db.get('pendingTransactions');
        blockchain.pendingTransactions = pendingTxs.map(txData => 
          Transaction.fromJSON(txData)
        );
      } catch (error) {
        if (error.code === 'LEVEL_NOT_FOUND') {
          blockchain.pendingTransactions = [];
        } else {
          throw error;
        }
      }
      
      console.log(`区块链加载成功，共有 ${blockchain.chain.length} 个区块`);
      return blockchain;
    } catch (error) {
      console.error('加载区块链失败:', error);
      throw error;
    }
  }

  /**
   * 保存区块
   * @param {Block} block - 要保存的区块
   * @param {number} index - 区块索引
   * @returns {Promise} - 保存操作的Promise
   */
  async saveBlock(block, index) {
    try {
      await this.db.put(`block_${index}`, block.toJSON());
      return true;
    } catch (error) {
      console.error(`保存区块 #${index} 失败:`, error);
      throw error;
    }
  }

  /**
   * 加载区块
   * @param {number} index - 区块索引
   * @returns {Promise<Block>} - 加载的区块
   */
  async loadBlock(index) {
    try {
      const blockData = await this.db.get(`block_${index}`);
      return Block.fromJSON(blockData, txData => Transaction.fromJSON(txData));
    } catch (error) {
      console.error(`加载区块 #${index} 失败:`, error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   * @returns {Promise} - 关闭操作的Promise
   */
  async close() {
    try {
      await this.db.close();
      console.log('数据库连接已关闭');
      return true;
    } catch (error) {
      console.error('关闭数据库连接失败:', error);
      throw error;
    }
  }
}
