/**
 * 发送交易命令行工具
 * 用于创建并发送交易到区块链网络
 */
import { Wallet } from '../wallet/wallet.js';
import { Transaction } from '../blockchain/transaction.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import axios from 'axios';

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 默认节点地址
const DEFAULT_NODE_URL = 'http://localhost:3000';

/**
 * 从命令行参数或用户输入获取交易信息
 */
async function getTransactionInfo() {
  // 检查命令行参数
  const args = process.argv.slice(2);
  
  let fromAddress, toAddress, amount, privateKey, nodeUrl;
  
  // 如果提供了足够的命令行参数
  if (args.length >= 3) {
    fromAddress = args[0];
    toAddress = args[1];
    amount = parseFloat(args[2]);
    privateKey = args[3]; // 可选
    nodeUrl = args[4] || DEFAULT_NODE_URL; // 可选
  } else {
    // 通过交互方式获取信息
    fromAddress = await askQuestion('发送方地址: ');
    toAddress = await askQuestion('接收方地址: ');
    amount = parseFloat(await askQuestion('发送金额: '));
    
    // 询问是否从文件加载钱包
    const loadFromFile = await askQuestion('是否从文件加载钱包? (y/n): ');
    
    if (loadFromFile.toLowerCase() === 'y') {
      const walletName = await askQuestion('钱包文件名: ');
      const walletDir = path.join(process.cwd(), 'data', 'wallets');
      const filePath = path.join(walletDir, `${walletName}.json`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`钱包文件不存在: ${filePath}`);
      }
      
      const wallet = Wallet.loadFromFile(filePath);
      privateKey = wallet.privateKey;
      
      // 验证地址是否匹配
      if (wallet.address !== fromAddress) {
        throw new Error('钱包地址与发送方地址不匹配');
      }
    } else {
      privateKey = await askQuestion('私钥: ');
    }
    
    nodeUrl = await askQuestion(`节点URL (默认: ${DEFAULT_NODE_URL}): `) || DEFAULT_NODE_URL;
  }
  
  // 验证输入
  if (!fromAddress || !toAddress || isNaN(amount) || amount <= 0 || !privateKey) {
    throw new Error('无效的交易信息');
  }
  
  return { fromAddress, toAddress, amount, privateKey, nodeUrl };
}

/**
 * 发送交易到节点
 * @param {Object} transactionInfo - 交易信息
 */
async function sendTransaction(transactionInfo) {
  const { fromAddress, toAddress, amount, privateKey, nodeUrl } = transactionInfo;
  
  try {
    // 创建钱包
    const wallet = new Wallet(privateKey);
    
    // 验证地址是否匹配
    if (wallet.address !== fromAddress) {
      throw new Error('私钥与发送方地址不匹配');
    }
    
    // 检查余额
    const balanceResponse = await axios.get(`${nodeUrl}/balance/${fromAddress}`);
    const balance = balanceResponse.data.balance;
    
    if (balance < amount) {
      throw new Error(`余额不足: ${balance}, 需要: ${amount}`);
    }
    
    // 发送交易请求
    const response = await axios.post(`${nodeUrl}/transaction`, {
      fromAddress,
      toAddress,
      amount,
      privateKey
    });
    
    console.log('\n交易已提交:');
    console.log(`交易ID: ${response.data.transaction.id}`);
    console.log(`发送方: ${fromAddress}`);
    console.log(`接收方: ${toAddress}`);
    console.log(`金额: ${amount}`);
    console.log(`状态: ${response.data.message}`);
    
  } catch (error) {
    if (error.response) {
      throw new Error(`服务器错误: ${error.response.data.error}`);
    } else if (error.request) {
      throw new Error(`无法连接到节点: ${nodeUrl}`);
    } else {
      throw error;
    }
  }
}

/**
 * 提问并获取用户输入
 * @param {string} question - 问题
 * @returns {Promise<string>} - 用户输入
 */
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('=== 发送交易 ===\n');
    
    // 获取交易信息
    const transactionInfo = await getTransactionInfo();
    
    // 确认交易信息
    console.log('\n交易信息:');
    console.log(`发送方: ${transactionInfo.fromAddress}`);
    console.log(`接收方: ${transactionInfo.toAddress}`);
    console.log(`金额: ${transactionInfo.amount}`);
    console.log(`节点URL: ${transactionInfo.nodeUrl}`);
    
    const confirm = await askQuestion('\n确认发送交易? (y/n): ');
    
    if (confirm.toLowerCase() === 'y') {
      await sendTransaction(transactionInfo);
    } else {
      console.log('交易已取消');
    }
  } catch (error) {
    console.error(`错误: ${error.message}`);
  } finally {
    rl.close();
  }
}

// 运行主函数
main().catch(error => {
  console.error('发送交易失败:', error);
  rl.close();
  process.exit(1);
});
