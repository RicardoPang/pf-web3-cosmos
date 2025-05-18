/**
 * 最长链验证测试脚本
 * 
 * 这个脚本演示了区块链系统如何在有多个有效链时选择最长的链
 */
import { Blockchain } from './src/blockchain/blockchain.js';
import { Block } from './src/blockchain/block.js';
import { Transaction } from './src/blockchain/transaction.js';

// 创建两个区块链实例
console.log('创建两个区块链实例...');
const blockchain1 = new Blockchain(1); // 第一个链
const blockchain2 = new Blockchain(1); // 第二个链

// 在第一个链上添加两个区块
console.log('\n在第一个链上添加两个区块...');
const tx1 = new Transaction(null, 'cosmos33887de77d7ced75d04692138ca1d3ea658751f1', 50, 'reward');
blockchain1.pendingTransactions.push(tx1);
const block1 = blockchain1.minePendingTransactions('cosmos33887de77d7ced75d04692138ca1d3ea658751f1');
console.log(`区块1已添加，哈希: ${block1.hash}`);

const tx2 = new Transaction(null, 'cosmos33887de77d7ced75d04692138ca1d3ea658751f1', 50, 'reward');
blockchain1.pendingTransactions.push(tx2);
const block2 = blockchain1.minePendingTransactions('cosmos33887de77d7ced75d04692138ca1d3ea658751f1');
console.log(`区块2已添加，哈希: ${block2.hash}`);

// 在第二个链上添加三个区块
console.log('\n在第二个链上添加三个区块...');
const tx3 = new Transaction(null, 'cosmos8f7c1f5d43d4c5bb8f590f05a0d2c2801881d1fa', 50, 'reward');
blockchain2.pendingTransactions.push(tx3);
const block3 = blockchain2.minePendingTransactions('cosmos8f7c1f5d43d4c5bb8f590f05a0d2c2801881d1fa');
console.log(`区块3已添加，哈希: ${block3.hash}`);

const tx4 = new Transaction(null, 'cosmos8f7c1f5d43d4c5bb8f590f05a0d2c2801881d1fa', 50, 'reward');
blockchain2.pendingTransactions.push(tx4);
const block4 = blockchain2.minePendingTransactions('cosmos8f7c1f5d43d4c5bb8f590f05a0d2c2801881d1fa');
console.log(`区块4已添加，哈希: ${block4.hash}`);

const tx5 = new Transaction(null, 'cosmos8f7c1f5d43d4c5bb8f590f05a0d2c2801881d1fa', 50, 'reward');
blockchain2.pendingTransactions.push(tx5);
const block5 = blockchain2.minePendingTransactions('cosmos8f7c1f5d43d4c5bb8f590f05a0d2c2801881d1fa');
console.log(`区块5已添加，哈希: ${block5.hash}`);

// 显示两个链的长度
console.log('\n链的长度比较:');
console.log(`链1的长度: ${blockchain1.chain.length}`);
console.log(`链2的长度: ${blockchain2.chain.length}`);

// 验证两个链的有效性
console.log('\n验证链的有效性:');
console.log(`链1是否有效: ${blockchain1.isChainValid()}`);
console.log(`链2是否有效: ${blockchain2.isChainValid()}`);

// 模拟链1收到链2，并进行最长链验证
console.log('\n执行最长链验证...');
const replaced = blockchain1.replaceChain(blockchain2.chain);
console.log(`链1是否被替换: ${replaced}`);

// 验证替换后的链
console.log('\n替换后的链1:');
console.log(`链1的长度: ${blockchain1.chain.length}`);
console.log(`链1的最后一个区块哈希: ${blockchain1.chain[blockchain1.chain.length - 1].hash}`);

// 显示链1上的所有区块
console.log('\n链1上的所有区块:');
blockchain1.chain.forEach((block, index) => {
  console.log(`区块 #${index}, 哈希: ${block.hash}`);
});
