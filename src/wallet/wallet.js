/**
 * 钱包模块
 * 负责管理用户的密钥对、地址和交易签名
 */
import { generateKeyPair, sign, verifySignature, deriveFromPrivateKey } from '../utils/crypto.js';
import { Transaction } from '../blockchain/transaction.js';
import fs from 'fs';
import path from 'path';

/**
 * 钱包类
 * 提供密钥管理和交易签名功能
 */
export class Wallet {
  /**
   * 创建一个新的钱包
   * @param {string} privateKey - 私钥（可选，如不提供则生成新的密钥对）
   */
  constructor(privateKey = null) {
    if (privateKey) {
      // 使用提供的私钥
      this.loadFromPrivateKey(privateKey);
    } else {
      // 生成新的密钥对
      const keyPair = generateKeyPair();
      this.privateKey = keyPair.privateKey;
      this.publicKey = keyPair.publicKey;
      this.address = keyPair.address;
    }
  }

  /**
   * 从私钥加载钱包
   * @param {string} privateKey - 私钥
   */
  loadFromPrivateKey(privateKey) {
    try {
      // 从私钥派生公钥和地址
      const { publicKey, address } = deriveFromPrivateKey(privateKey);
      this.privateKey = privateKey;
      this.publicKey = publicKey;
      this.address = address;
    } catch (error) {
      throw new Error(`无效的私钥: ${error.message}`);
    }
  }

  /**
   * 创建并签名一笔交易
   * @param {string} toAddress - 接收方地址
   * @param {number} amount - 交易金额
   * @returns {Transaction} - 已签名的交易
   */
  createTransaction(toAddress, amount) {
    const transaction = new Transaction(this.address, toAddress, amount);
    transaction.signTransaction(this.privateKey);
    return transaction;
  }

  /**
   * 保存钱包到文件
   * @param {string} filePath - 保存路径
   * @param {string} password - 加密密码（可选）
   */
  saveToFile(filePath, password = '') {
    const walletData = {
      privateKey: this.privateKey,
      publicKey: this.publicKey,
      address: this.address
    };
    
    // 这里简化处理，实际应该对私钥进行加密
    const data = JSON.stringify(walletData, null, 2);
    
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, data);
    console.log(`钱包已保存到: ${filePath}`);
  }

  /**
   * 从文件加载钱包
   * @param {string} filePath - 文件路径
   * @param {string} password - 解密密码（可选）
   * @returns {Wallet} - 加载的钱包
   */
  static loadFromFile(filePath, password = '') {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const walletData = JSON.parse(data);
      
      // 这里简化处理，实际应该对私钥进行解密
      return new Wallet(walletData.privateKey);
    } catch (error) {
      throw new Error(`加载钱包失败: ${error.message}`);
    }
  }

  /**
   * 获取钱包信息
   * @returns {Object} - 钱包信息
   */
  getInfo() {
    return {
      address: this.address,
      publicKey: this.publicKey
    };
  }
}
