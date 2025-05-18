/**
 * 交易模块
 * 负责创建、验证和处理交易
 */
import { v4 as uuidv4 } from 'uuid';
import { calculateHash, sign, verifySignature } from '../utils/crypto.js';

/**
 * 交易类
 * 表示区块链上的一笔交易
 */
export class Transaction {
  /**
   * 创建一个新的交易
   * @param {string} fromAddress - 发送方地址（如果是挖矿奖励，可以为null）
   * @param {string} toAddress - 接收方地址
   * @param {number} amount - 交易金额
   * @param {string} type - 交易类型（'regular'或'reward'）
   */
  constructor(fromAddress, toAddress, amount, type = 'regular') {
    this.id = uuidv4(); // 生成唯一的交易ID
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.type = type; // 交易类型：regular(普通交易) 或 reward(挖矿奖励)
    this.signature = null; // 交易签名，用于验证交易有效性
  }

  /**
   * 计算交易的哈希值
   * @returns {string} - 交易的哈希值
   */
  calculateHash() {
    // 不包含签名的交易数据
    const transactionData = {
      id: this.id,
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: this.amount,
      timestamp: this.timestamp,
      type: this.type
    };
    
    return calculateHash(transactionData);
  }

  /**
   * 使用发送方的私钥对交易进行签名
   * @param {string} signingKey - 发送方的私钥
   */
  signTransaction(signingKey) {
    // 挖矿奖励交易不需要签名
    if (this.type === 'reward') {
      return;
    }
    
    // 确保交易未被签名
    if (this.signature) {
      throw new Error('这笔交易已经被签名了');
    }
    
    // 计算交易哈希并使用私钥签名
    const transactionHash = this.calculateHash();
    this.signature = sign(transactionHash, signingKey);
  }

  /**
   * 验证交易签名是否有效
   * @param {string} publicKey - 发送方的公钥
   * @returns {boolean} - 签名是否有效
   */
  isValid(publicKey) {
    // 挖矿奖励交易不需要验证签名
    if (this.type === 'reward') {
      return true;
    }
    
    // 检查是否有发送方地址
    if (!this.fromAddress) {
      throw new Error('没有发送方地址');
    }
    
    // 检查是否有签名
    if (!this.signature) {
      throw new Error('没有找到交易签名');
    }
    
    // 验证签名
    const transactionHash = this.calculateHash();
    return verifySignature(transactionHash, this.signature, publicKey);
  }

  /**
   * 将交易转换为JSON格式
   * @returns {Object} - JSON格式的交易数据
   */
  toJSON() {
    return {
      id: this.id,
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: this.amount,
      timestamp: this.timestamp,
      type: this.type,
      signature: this.signature
    };
  }

  /**
   * 从JSON数据创建交易对象
   * @param {Object} data - JSON格式的交易数据
   * @returns {Transaction} - 创建的交易对象
   */
  static fromJSON(data) {
    const transaction = new Transaction(
      data.fromAddress,
      data.toAddress,
      data.amount,
      data.type
    );
    transaction.id = data.id;
    transaction.timestamp = data.timestamp;
    transaction.signature = data.signature;
    return transaction;
  }
}
