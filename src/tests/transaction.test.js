/**
 * 交易单元测试
 * 测试交易的创建、签名和验证功能
 */
import { Transaction } from '../blockchain/transaction.js';
import { generateKeyPair } from '../utils/crypto.js';

// 测试交易创建
describe('交易创建测试', () => {
  test('应该正确创建交易', () => {
    const tx = new Transaction('sender123', 'receiver456', 10);
    
    expect(tx.fromAddress).toBe('sender123');
    expect(tx.toAddress).toBe('receiver456');
    expect(tx.amount).toBe(10);
    expect(tx.type).toBe('regular');
    expect(tx.id).toBeDefined();
    expect(tx.timestamp).toBeDefined();
    expect(tx.signature).toBeNull();
  });
  
  test('应该正确创建挖矿奖励交易', () => {
    const tx = new Transaction(null, 'miner789', 50, 'reward');
    
    expect(tx.fromAddress).toBeNull();
    expect(tx.toAddress).toBe('miner789');
    expect(tx.amount).toBe(50);
    expect(tx.type).toBe('reward');
  });
});

// 测试交易签名
describe('交易签名测试', () => {
  test('应该能够正确签名交易', () => {
    // 生成密钥对
    const keyPair = generateKeyPair();
    const tx = new Transaction(keyPair.address, 'receiver456', 10);
    
    // 签名交易
    tx.signTransaction(keyPair.privateKey);
    
    expect(tx.signature).not.toBeNull();
  });
  
  test('使用错误的私钥签名应该失败', () => {
    // 生成两个密钥对
    const keyPair1 = generateKeyPair();
    const keyPair2 = generateKeyPair();
    
    const tx = new Transaction(keyPair1.address, 'receiver456', 10);
    
    // 使用不匹配的私钥签名
    expect(() => {
      tx.signTransaction(keyPair2.privateKey);
    }).toThrow();
  });
  
  test('挖矿奖励交易不需要签名', () => {
    const tx = new Transaction(null, 'miner789', 50, 'reward');
    
    // 尝试签名挖矿奖励交易
    tx.signTransaction('somePrivateKey');
    
    // 挖矿奖励交易不应该有签名
    expect(tx.signature).toBeNull();
  });
});

// 测试交易验证
describe('交易验证测试', () => {
  test('有效签名的交易应该通过验证', () => {
    // 生成密钥对
    const keyPair = generateKeyPair();
    const tx = new Transaction(keyPair.address, 'receiver456', 10);
    
    // 签名交易
    tx.signTransaction(keyPair.privateKey);
    
    // 验证交易
    expect(tx.isValid(keyPair.publicKey)).toBe(true);
  });
  
  test('篡改的交易应该验证失败', () => {
    // 生成密钥对
    const keyPair = generateKeyPair();
    const tx = new Transaction(keyPair.address, 'receiver456', 10);
    
    // 签名交易
    tx.signTransaction(keyPair.privateKey);
    
    // 篡改交易数据
    tx.amount = 100;
    
    // 验证交易
    expect(tx.isValid(keyPair.publicKey)).toBe(false);
  });
  
  test('挖矿奖励交易应该始终有效', () => {
    const tx = new Transaction(null, 'miner789', 50, 'reward');
    
    // 验证挖矿奖励交易
    expect(tx.isValid()).toBe(true);
  });
});

// 测试交易序列化和反序列化
describe('交易序列化测试', () => {
  test('应该能够正确序列化和反序列化交易', () => {
    // 生成密钥对
    const keyPair = generateKeyPair();
    const originalTx = new Transaction(keyPair.address, 'receiver456', 10);
    
    // 签名交易
    originalTx.signTransaction(keyPair.privateKey);
    
    // 序列化
    const txJSON = originalTx.toJSON();
    
    // 反序列化
    const restoredTx = Transaction.fromJSON(txJSON);
    
    // 验证反序列化后的交易
    expect(restoredTx.id).toBe(originalTx.id);
    expect(restoredTx.fromAddress).toBe(originalTx.fromAddress);
    expect(restoredTx.toAddress).toBe(originalTx.toAddress);
    expect(restoredTx.amount).toBe(originalTx.amount);
    expect(restoredTx.timestamp).toBe(originalTx.timestamp);
    expect(restoredTx.type).toBe(originalTx.type);
    expect(restoredTx.signature).toBe(originalTx.signature);
  });
});
