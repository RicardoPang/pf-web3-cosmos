/**
 * 区块链模块
 * 管理区块链的核心逻辑，包括区块添加、交易处理和共识机制
 */
import { Block } from './block.js';
import { Transaction } from './transaction.js';
import { EventEmitter } from 'events';

/**
 * 区块链类
 * 实现区块链的核心功能
 */
export class Blockchain extends EventEmitter {
  /**
   * 创建一个新的区块链实例
   * @param {number} difficulty - 挖矿难度
   * @param {number} miningReward - 挖矿奖励金额
   */
  constructor(difficulty = 2, miningReward = 50) {
    super();
    this.chain = [this.createGenesisBlock()]; // 初始化区块链，添加创世区块
    this.difficulty = difficulty; // 挖矿难度
    this.pendingTransactions = []; // 待处理的交易
    this.miningReward = miningReward; // 挖矿奖励金额
  }

  /**
   * 创建创世区块
   * @returns {Block} - 创世区块
   */
  createGenesisBlock() {
    return new Block(0, '0'.repeat(64), [], 1);
  }

  /**
   * 获取最新的区块
   * @returns {Block} - 链上最新的区块
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * 添加待处理交易
   * @param {Transaction} transaction - 要添加的交易
   * @returns {number} - 交易被添加到的区块索引
   */
  addTransaction(transaction) {
    // 验证交易
    if (!transaction.fromAddress && transaction.type !== 'reward') {
      throw new Error('交易必须有发送方地址或是挖矿奖励');
    }

    if (!transaction.toAddress) {
      throw new Error('交易必须有接收方地址');
    }

    if (transaction.amount <= 0) {
      throw new Error('交易金额必须大于0');
    }

    // 验证发送方余额是否足够（非挖矿奖励交易）
    if (transaction.fromAddress && transaction.type !== 'reward') {
      const balance = this.getBalanceOfAddress(transaction.fromAddress);
      if (balance < transaction.amount) {
        throw new Error('余额不足');
      }
    }

    // 将交易添加到待处理列表
    this.pendingTransactions.push(transaction);
    this.emit('transactionAdded', transaction);

    return this.getLatestBlock().index + 1;
  }

  /**
   * 开始挖矿，处理待处理的交易
   * @param {string} miningRewardAddress - 接收挖矿奖励的地址
   * @returns {Block} - 新挖出的区块
   */
  minePendingTransactions(miningRewardAddress) {
    // 创建挖矿奖励交易
    const rewardTx = new Transaction(
      null,
      miningRewardAddress,
      this.miningReward,
      'reward'
    );
    this.pendingTransactions.push(rewardTx);

    // 创建新区块
    const block = new Block(
      this.getLatestBlock().index + 1,
      this.getLatestBlock().hash,
      this.pendingTransactions,
      this.difficulty
    );

    // 挖矿（寻找符合难度要求的哈希）
    block.mineBlock();

    // 将新区块添加到链上
    this.chain.push(block);

    // 清空待处理交易列表，为下一个区块做准备
    this.pendingTransactions = [];

    // 发出区块挖掘成功的事件
    this.emit('blockMined', block);

    return block;
  }

  /**
   * 获取指定地址的余额
   * @param {string} address - 要查询余额的地址
   * @returns {number} - 地址的余额
   */
  getBalanceOfAddress(address) {
    let balance = 0;

    // 遍历所有区块中的所有交易
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        // 如果该地址是交易的接收方，增加余额
        if (transaction.toAddress === address) {
          balance += transaction.amount;
        }

        // 如果该地址是交易的发送方，减少余额
        if (transaction.fromAddress === address) {
          balance -= transaction.amount;
        }
      }
    }

    return balance;
  }

  /**
   * 获取指定地址的交易历史
   * @param {string} address - 要查询的地址
   * @returns {Array} - 交易历史列表
   */
  getTransactionsForAddress(address) {
    const transactions = [];

    // 遍历所有区块中的所有交易
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (
          transaction.fromAddress === address ||
          transaction.toAddress === address
        ) {
          transactions.push({
            ...transaction,
            blockIndex: block.index,
            blockHash: block.hash,
          });
        }
      }
    }

    return transactions;
  }

  /**
   * 验证区块链的完整性
   * @returns {boolean} - 区块链是否有效
   */
  isChainValid() {
    // 从第二个区块开始验证（第一个是创世区块）
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // 验证当前区块的哈希是否正确
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.error(`区块 #${i} 的哈希值无效`);
        return false;
      }

      // 验证当前区块的previousHash是否指向前一个区块的哈希
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`区块 #${i} 的前一个区块哈希值无效`);
        return false;
      }

      // 验证区块是否符合难度要求
      if (
        currentBlock.hash.substring(0, currentBlock.difficulty) !==
        '0'.repeat(currentBlock.difficulty)
      ) {
        console.error(`区块 #${i} 未满足难度要求`);
        return false;
      }
    }

    return true;
  }

  /**
   * 替换当前链为更长的有效链
   * @param {Array} newChain - 新的区块链
   * @returns {boolean} - 是否成功替换
   */
  replaceChain(newChain) {
    // 验证新链的长度是否大于当前链
    if (newChain.length <= this.chain.length) {
      console.log('接收到的链不比当前链长，不替换');
      return false;
    }

    // 验证新链的有效性
    if (!this.isValidChain(newChain)) {
      console.log('接收到的链无效，不替换');
      return false;
    }

    console.log('替换当前链为新链');
    this.chain = newChain;
    this.emit('chainReplaced', this.chain);
    return true;
  }

  /**
   * 验证一个链是否有效
   * @param {Array} chain - 要验证的链
   * @returns {boolean} - 链是否有效
   */
  isValidChain(chain) {
    // 验证创世区块 - 只检查索引和哈希前缀
    const genesisBlock = chain[0];
    if (genesisBlock.index !== 0 || !genesisBlock.hash.startsWith('0')) {
      console.log('创世区块无效');
      return false;
    }

    // 验证链中的每个区块
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const previousBlock = chain[i - 1];

      // 验证区块哈希前缀符合难度要求
      if (!block.hash.startsWith('0'.repeat(block.difficulty))) {
        console.log(`区块 #${i} 的哈希不符合难度要求`);
        return false;
      }

      // 验证区块链接
      if (block.previousHash !== previousBlock.hash) {
        console.log(`区块 #${i} 的前一个区块哈希值无效`);
        return false;
      }
    }

    return true;
  }

  /**
   * 将区块链转换为JSON格式
   * @returns {Array} - JSON格式的区块链数据
   */
  toJSON() {
    return this.chain.map((block) => block.toJSON());
  }

  /**
   * 从JSON数据创建区块链对象
   * @param {Array} data - JSON格式的区块链数据
   * @returns {Blockchain} - 创建的区块链对象
   */
  static fromJSON(data) {
    const blockchain = new Blockchain();
    blockchain.chain = data.map((blockData) =>
      Block.fromJSON(blockData, (txData) => Transaction.fromJSON(txData))
    );
    return blockchain;
  }

  /**
   * 调整挖矿难度
   * 基于最近区块的生成速度动态调整难度
   * @param {number} expectedBlockTime - 期望的区块生成时间（毫秒）
   */
  adjustDifficulty(expectedBlockTime = 10000) {
    // 默认期望10秒生成一个区块
    const lastBlock = this.getLatestBlock();

    // 如果链中只有创世区块，保持当前难度
    if (lastBlock.index === 0) {
      return this.difficulty;
    }

    const previousBlock = this.chain[this.chain.length - 2];
    const timeUsed = lastBlock.timestamp - previousBlock.timestamp;

    // 如果区块生成时间过快，增加难度；如果过慢，降低难度
    if (timeUsed < expectedBlockTime / 2) {
      this.difficulty++;
      console.log(`难度增加到 ${this.difficulty}`);
    } else if (timeUsed > expectedBlockTime * 2 && this.difficulty > 1) {
      this.difficulty--;
      console.log(`难度降低到 ${this.difficulty}`);
    }

    return this.difficulty;
  }
}
