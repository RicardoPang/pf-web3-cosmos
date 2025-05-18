/**
 * 区块单元测试
 * 测试区块的创建、哈希计算和验证功能
 */
import { Block } from '../blockchain/block.js';
import { Transaction } from '../blockchain/transaction.js';

// 模拟交易数据
const mockTransactions = [
  new Transaction('address1', 'address2', 10),
  new Transaction('address2', 'address3', 5)
];

// 测试区块创建
describe('区块创建测试', () => {
  test('应该正确创建区块', () => {
    const block = new Block(1, 'prev123', mockTransactions, 2);
    
    expect(block.index).toBe(1);
    expect(block.previousHash).toBe('prev123');
    expect(block.transactions.length).toBe(2);
    expect(block.difficulty).toBe(2);
    expect(block.nonce).toBe(0);
    expect(block.hash).toBeDefined();
    expect(block.merkleRoot).toBeDefined();
  });
});

// 测试区块哈希计算
describe('区块哈希计算测试', () => {
  test('修改区块数据后哈希应该改变', () => {
    const block = new Block(1, 'prev123', mockTransactions, 2);
    const originalHash = block.hash;
    
    // 修改区块数据
    block.nonce = 100;
    block.hash = block.calculateHash();
    
    expect(block.hash).not.toBe(originalHash);
  });
});

// 测试区块挖矿
describe('区块挖矿测试', () => {
  test('挖矿后哈希应该满足难度要求', () => {
    const block = new Block(1, 'prev123', mockTransactions, 2);
    block.mineBlock();
    
    // 验证哈希前缀是否符合难度要求（前n位为0）
    expect(block.hash.substring(0, block.difficulty)).toBe('0'.repeat(block.difficulty));
  });
});

// 测试区块验证
describe('区块验证测试', () => {
  test('有效区块应该通过验证', () => {
    const block = new Block(1, 'prev123', mockTransactions, 2);
    block.mineBlock();
    
    expect(block.isValid()).toBe(true);
  });
  
  test('篡改的区块应该验证失败', () => {
    const block = new Block(1, 'prev123', mockTransactions, 2);
    block.mineBlock();
    
    // 篡改区块数据但不重新计算哈希
    block.transactions.push(new Transaction('address3', 'address4', 20));
    
    expect(block.isValid()).toBe(false);
  });
});

// 测试区块序列化和反序列化
describe('区块序列化测试', () => {
  test('应该能够正确序列化和反序列化区块', () => {
    const originalBlock = new Block(1, 'prev123', mockTransactions, 2);
    originalBlock.mineBlock();
    
    // 序列化
    const blockJSON = originalBlock.toJSON();
    
    // 反序列化
    const restoredBlock = Block.fromJSON(blockJSON, txData => Transaction.fromJSON(txData));
    
    // 验证反序列化后的区块
    expect(restoredBlock.index).toBe(originalBlock.index);
    expect(restoredBlock.hash).toBe(originalBlock.hash);
    expect(restoredBlock.previousHash).toBe(originalBlock.previousHash);
    expect(restoredBlock.nonce).toBe(originalBlock.nonce);
    expect(restoredBlock.difficulty).toBe(originalBlock.difficulty);
    expect(restoredBlock.merkleRoot).toBe(originalBlock.merkleRoot);
    expect(restoredBlock.transactions.length).toBe(originalBlock.transactions.length);
  });
});
