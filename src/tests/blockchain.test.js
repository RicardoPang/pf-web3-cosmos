/**
 * 区块链单元测试
 * 测试区块链的创建、交易处理和共识机制
 */
import { Blockchain } from '../blockchain/blockchain.js';
import { Transaction } from '../blockchain/transaction.js';
import { Block } from '../blockchain/block.js';
import { generateKeyPair } from '../utils/crypto.js';

// 禁用控制台输出，使测试输出更清晰
global.console.log = jest.fn();
global.console.error = jest.fn();

// 测试区块链创建
describe('区块链创建测试', () => {
  test('应该正确创建区块链', () => {
    const blockchain = new Blockchain();
    
    // 验证创世区块
    expect(blockchain.chain.length).toBe(1);
    expect(blockchain.chain[0].index).toBe(0);
    expect(blockchain.chain[0].previousHash).toBe('0'.repeat(64));
    expect(blockchain.pendingTransactions).toEqual([]);
  });
});

// 测试交易处理
describe('交易处理测试', () => {
  let blockchain;
  let senderKeyPair;
  let receiverKeyPair;
  
  beforeEach(() => {
    blockchain = new Blockchain();
    senderKeyPair = generateKeyPair();
    receiverKeyPair = generateKeyPair();
    
    // 给发送方一些初始代币（通过挖矿）
    const rewardTx = new Transaction(null, senderKeyPair.address, 100, 'reward');
    blockchain.pendingTransactions = [rewardTx];
    blockchain.minePendingTransactions('minerAddress');
  });
  
  test('应该能够添加交易到待处理列表', () => {
    const tx = new Transaction(senderKeyPair.address, receiverKeyPair.address, 10);
    tx.signTransaction(senderKeyPair.privateKey);
    
    const txIndex = blockchain.addTransaction(tx);
    
    expect(blockchain.pendingTransactions.length).toBe(1);
    expect(blockchain.pendingTransactions[0]).toBe(tx);
    expect(txIndex).toBe(blockchain.getLatestBlock().index + 1);
  });
  
  test('余额不足应该无法添加交易', () => {
    const tx = new Transaction(senderKeyPair.address, receiverKeyPair.address, 200); // 余额只有100
    tx.signTransaction(senderKeyPair.privateKey);
    
    expect(() => {
      blockchain.addTransaction(tx);
    }).toThrow('余额不足');
  });
  
  test('挖矿应该处理待处理交易并创建新区块', () => {
    // 添加一笔交易
    const tx = new Transaction(senderKeyPair.address, receiverKeyPair.address, 10);
    tx.signTransaction(senderKeyPair.privateKey);
    blockchain.addTransaction(tx);
    
    const originalChainLength = blockchain.chain.length;
    
    // 挖矿
    const newBlock = blockchain.minePendingTransactions('minerAddress');
    
    // 验证新区块已添加到链上
    expect(blockchain.chain.length).toBe(originalChainLength + 1);
    expect(blockchain.chain[blockchain.chain.length - 1]).toBe(newBlock);
    
    // 验证待处理交易已被处理
    expect(blockchain.pendingTransactions.length).toBe(0);
    
    // 验证交易已被包含在新区块中
    expect(newBlock.transactions.length).toBe(2); // 1个用户交易 + 1个挖矿奖励
    expect(newBlock.transactions[0].fromAddress).toBe(senderKeyPair.address);
    expect(newBlock.transactions[0].toAddress).toBe(receiverKeyPair.address);
    expect(newBlock.transactions[0].amount).toBe(10);
    
    // 验证挖矿奖励
    expect(newBlock.transactions[1].type).toBe('reward');
    expect(newBlock.transactions[1].toAddress).toBe('minerAddress');
    expect(newBlock.transactions[1].amount).toBe(blockchain.miningReward);
  });
});

// 测试余额计算
describe('余额计算测试', () => {
  let blockchain;
  let address1;
  let address2;
  
  beforeEach(() => {
    blockchain = new Blockchain();
    address1 = 'address1';
    address2 = 'address2';
    
    // 给address1一些初始代币
    const rewardTx = new Transaction(null, address1, 100, 'reward');
    blockchain.pendingTransactions = [rewardTx];
    blockchain.minePendingTransactions('minerAddress');
  });
  
  test('应该正确计算账户余额', () => {
    expect(blockchain.getBalanceOfAddress(address1)).toBe(100);
    expect(blockchain.getBalanceOfAddress(address2)).toBe(0);
    expect(blockchain.getBalanceOfAddress('minerAddress')).toBe(blockchain.miningReward);
  });
  
  test('转账后应该正确更新余额', () => {
    // 创建一笔从address1到address2的交易
    const tx = new Transaction(address1, address2, 30);
    blockchain.pendingTransactions = [tx];
    blockchain.minePendingTransactions('minerAddress');
    
    // 验证余额
    expect(blockchain.getBalanceOfAddress(address1)).toBe(70); // 100 - 30
    expect(blockchain.getBalanceOfAddress(address2)).toBe(30);
    expect(blockchain.getBalanceOfAddress('minerAddress')).toBe(blockchain.miningReward * 2); // 两次挖矿奖励
  });
});

// 测试区块链验证
describe('区块链验证测试', () => {
  let blockchain;
  
  beforeEach(() => {
    blockchain = new Blockchain();
    
    // 添加几个区块
    for (let i = 0; i < 3; i++) {
      const tx = new Transaction(null, `address${i}`, 50, 'reward');
      blockchain.pendingTransactions = [tx];
      blockchain.minePendingTransactions('minerAddress');
    }
  });
  
  test('有效的区块链应该通过验证', () => {
    expect(blockchain.isChainValid()).toBe(true);
  });
  
  test('篡改区块应该导致验证失败', () => {
    // 篡改第二个区块的交易
    blockchain.chain[1].transactions[0].amount = 100;
    
    expect(blockchain.isChainValid()).toBe(false);
  });
  
  test('篡改区块链接应该导致验证失败', () => {
    // 篡改第二个区块的previousHash
    blockchain.chain[2].previousHash = 'fakeHash';
    
    expect(blockchain.isChainValid()).toBe(false);
  });
});

// 测试最长链选择
describe('最长链选择测试', () => {
  let blockchain;
  
  beforeEach(() => {
    blockchain = new Blockchain();
    
    // 添加几个区块
    for (let i = 0; i < 2; i++) {
      const tx = new Transaction(null, `address${i}`, 50, 'reward');
      blockchain.pendingTransactions = [tx];
      blockchain.minePendingTransactions('minerAddress');
    }
  });
  
  test('应该选择更长的有效链', () => {
    // 创建一个更长的链
    const longerChain = JSON.parse(JSON.stringify(blockchain.chain));
    
    // 在更长的链上添加一个新区块
    const newBlock = {
      index: longerChain.length,
      timestamp: Date.now(),
      previousHash: longerChain[longerChain.length - 1].hash,
      transactions: [{ 
        id: 'tx1', 
        fromAddress: null, 
        toAddress: 'address3', 
        amount: 50, 
        timestamp: Date.now(),
        type: 'reward',
        signature: null
      }],
      difficulty: 2,
      nonce: 0,
      hash: '',
      merkleRoot: '0'.repeat(64)
    };
    
    // 计算新区块的哈希（模拟）
    newBlock.hash = '0'.repeat(2) + 'a'.repeat(62); // 符合难度为2的哈希
    
    longerChain.push(newBlock);
    
    // 尝试替换链
    const result = blockchain.replaceChain(longerChain);
    
    // 验证链已被替换
    expect(result).toBe(true);
    expect(blockchain.chain.length).toBe(longerChain.length);
  });
  
  test('不应该选择更短的链', () => {
    // 创建一个更短的链
    const shorterChain = blockchain.chain.slice(0, 1);
    
    // 尝试替换链
    const result = blockchain.replaceChain(shorterChain);
    
    // 验证链未被替换
    expect(result).toBe(false);
    expect(blockchain.chain.length).toBe(3); // 创世区块 + 2个挖出的区块
  });
  
  test('不应该选择无效的链', () => {
    // 创建一个更长但无效的链
    const invalidChain = JSON.parse(JSON.stringify(blockchain.chain));
    
    // 在无效链上添加一个新区块
    const newBlock = {
      index: invalidChain.length,
      timestamp: Date.now(),
      previousHash: 'wrongPreviousHash', // 错误的前一个区块哈希
      transactions: [{ 
        id: 'tx1', 
        fromAddress: null, 
        toAddress: 'address3', 
        amount: 50, 
        timestamp: Date.now(),
        type: 'reward',
        signature: null
      }],
      difficulty: 2,
      nonce: 0,
      hash: '0'.repeat(2) + 'a'.repeat(62), // 符合难度为2的哈希
      merkleRoot: '0'.repeat(64)
    };
    
    invalidChain.push(newBlock);
    
    // 尝试替换链
    const result = blockchain.replaceChain(invalidChain);
    
    // 验证链未被替换
    expect(result).toBe(false);
    expect(blockchain.chain.length).toBe(3); // 创世区块 + 2个挖出的区块
  });
});
