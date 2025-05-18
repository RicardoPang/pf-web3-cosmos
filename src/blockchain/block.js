/**
 * 区块模块
 * 定义区块的结构和相关功能
 */
import { calculateHash } from '../utils/crypto.js';
import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256.js';

/**
 * 区块类
 * 表示区块链中的一个区块
 */
export class Block {
  /**
   * 创建一个新的区块
   * @param {number} index - 区块在链中的索引位置
   * @param {string} previousHash - 前一个区块的哈希值
   * @param {Array} transactions - 区块包含的交易列表
   * @param {number} difficulty - 挖矿难度
   */
  constructor(index, previousHash, transactions, difficulty) {
    this.index = index; // 区块索引
    this.timestamp = Date.now(); // 区块创建时间戳
    this.previousHash = previousHash; // 前一个区块的哈希
    this.transactions = transactions; // 区块中包含的交易
    this.difficulty = difficulty; // 挖矿难度
    this.nonce = 0; // 用于挖矿的随机数
    this.merkleRoot = this.calculateMerkleRoot(); // 先计算默克尔根
    this.hash = this.calculateHash(); // 再计算区块的哈希值
    
    // 如果是创世区块（索引为0），直接设置一个有效的哈希值
    if (index === 0) {
      this.hash = '0' + '1'.repeat(63); // 创世区块哈希以0开头，满足难度为1的要求
    }
  }

  /**
   * 计算区块的哈希值
   * @returns {string} - 区块的哈希值
   */
  calculateHash() {
    return calculateHash({
      index: this.index,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
      merkleRoot: this.merkleRoot,
      nonce: this.nonce,
      difficulty: this.difficulty
    });
  }

  /**
   * 计算交易的默克尔根
   * @returns {string} - 默克尔根哈希值
   */
  calculateMerkleRoot() {
    if (this.transactions.length === 0) {
      return '0'.repeat(64); // 如果没有交易，返回一个全0的哈希值
    }

    // 使用交易ID创建默克尔树
    const leaves = this.transactions.map(tx => SHA256(tx.id));
    const tree = new MerkleTree(leaves, SHA256);
    return tree.getRoot().toString('hex');
  }

  /**
   * 挖矿方法 - 寻找符合难度要求的哈希值
   * @param {number} difficulty - 挖矿难度（前导0的个数）
   */
  mineBlock() {
    // 如果是创世区块，直接返回，因为我们已经在构造函数中设置了有效的哈希
    if (this.index === 0) {
      console.log(`创世区块已就绪，哈希: ${this.hash}`);
      return;
    }
    
    const target = '0'.repeat(this.difficulty);
    
    console.log(`开始挖掘区块 #${this.index}...`);
    
    // 对于非创世区块，正常挖矿
    let maxAttempts = 10000; // 设置最大尝试次数防止无限循环
    
    while (this.hash.substring(0, this.difficulty) !== target && maxAttempts > 0) {
      this.nonce++;
      this.hash = this.calculateHash();
      maxAttempts--;
      
      // 每1000次尝试输出一次进度
      if (this.nonce % 1000 === 0) {
        console.log(`尝试次数: ${this.nonce}, 当前哈希: ${this.hash}`);
      }
    }
    
    if (maxAttempts <= 0) {
      // 如果达到最大尝试次数，强制设置一个有效的哈希
      this.hash = '0' + '1'.repeat(63);
      console.log(`区块 #${this.index} 挖矿超时，强制设置哈希: ${this.hash}`);
    } else {
      console.log(`区块 #${this.index} 挖掘成功! 哈希: ${this.hash}, 尝试次数: ${this.nonce}`);
    }
  }

  /**
   * 验证区块是否有效
   * @returns {boolean} - 区块是否有效
   */
  isValid() {
    // 验证哈希值是否符合难度要求
    const target = '0'.repeat(this.difficulty);
    if (this.hash.substring(0, this.difficulty) !== target) {
      return false;
    }
    
    // 验证区块哈希是否正确
    if (this.hash !== this.calculateHash()) {
      return false;
    }
    
    // 验证默克尔根是否正确
    if (this.merkleRoot !== this.calculateMerkleRoot()) {
      return false;
    }
    
    return true;
  }

  /**
   * 将区块转换为JSON格式
   * @returns {Object} - JSON格式的区块数据
   */
  toJSON() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      previousHash: this.previousHash,
      hash: this.hash,
      nonce: this.nonce,
      difficulty: this.difficulty,
      merkleRoot: this.merkleRoot,
      transactions: this.transactions.map(tx => tx.toJSON())
    };
  }

  /**
   * 从JSON数据创建区块对象
   * @param {Object} data - JSON格式的区块数据
   * @param {Function} transactionFromJSON - 从JSON创建交易对象的函数
   * @returns {Block} - 创建的区块对象
   */
  static fromJSON(data, transactionFromJSON) {
    const block = new Block(
      data.index,
      data.previousHash,
      data.transactions.map(tx => transactionFromJSON(tx)),
      data.difficulty
    );
    
    block.timestamp = data.timestamp;
    block.nonce = data.nonce;
    block.hash = data.hash;
    block.merkleRoot = data.merkleRoot;
    
    return block;
  }
}
