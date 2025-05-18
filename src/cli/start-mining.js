/**
 * 开始挖矿命令行工具
 * 用于启动区块链挖矿进程
 */
import axios from 'axios';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { Wallet } from '../wallet/wallet.js';

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 默认节点地址
const DEFAULT_NODE_URL = 'http://localhost:3000';

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
 * 获取矿工地址
 */
async function getMinerAddress() {
  // 检查命令行参数
  const args = process.argv.slice(2);
  
  let minerAddress, nodeUrl;
  
  // 如果提供了命令行参数
  if (args.length >= 1) {
    minerAddress = args[0];
    nodeUrl = args[1] || DEFAULT_NODE_URL;
  } else {
    // 通过交互方式获取信息
    console.log('请选择矿工账户:');
    console.log('1. 使用现有钱包');
    console.log('2. 创建新钱包');
    
    const choice = await askQuestion('请选择 (1/2): ');
    
    if (choice === '1') {
      // 列出可用的钱包文件
      const walletDir = path.join(process.cwd(), 'data', 'wallets');
      
      if (!fs.existsSync(walletDir)) {
        fs.mkdirSync(walletDir, { recursive: true });
        console.log('没有找到现有钱包，将创建新钱包');
        return getNewWallet();
      }
      
      const walletFiles = fs.readdirSync(walletDir)
        .filter(file => file.endsWith('.json'));
      
      if (walletFiles.length === 0) {
        console.log('没有找到现有钱包，将创建新钱包');
        return getNewWallet();
      }
      
      console.log('\n可用钱包:');
      walletFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.replace('.json', '')}`);
      });
      
      const walletIndex = parseInt(await askQuestion('请选择钱包 (输入序号): ')) - 1;
      
      if (walletIndex < 0 || walletIndex >= walletFiles.length) {
        throw new Error('无效的钱包选择');
      }
      
      const walletPath = path.join(walletDir, walletFiles[walletIndex]);
      const wallet = Wallet.loadFromFile(walletPath);
      
      minerAddress = wallet.address;
    } else {
      // 创建新钱包
      const result = await getNewWallet();
      minerAddress = result.minerAddress;
    }
    
    nodeUrl = await askQuestion(`节点URL (默认: ${DEFAULT_NODE_URL}): `) || DEFAULT_NODE_URL;
  }
  
  if (!minerAddress) {
    throw new Error('未提供矿工地址');
  }
  
  return { minerAddress, nodeUrl };
}

/**
 * 创建新钱包作为矿工账户
 */
async function getNewWallet() {
  const wallet = new Wallet();
  
  console.log('\n已创建新钱包:');
  console.log(`地址: ${wallet.address}`);
  console.log(`公钥: ${wallet.publicKey}`);
  console.log(`私钥: ${wallet.privateKey}`);
  
  // 询问是否保存钱包
  const save = await askQuestion('\n是否保存此钱包? (y/n): ');
  
  if (save.toLowerCase() === 'y') {
    const walletName = await askQuestion('请输入钱包名称: ') || 'miner';
    const walletDir = path.join(process.cwd(), 'data', 'wallets');
    const filePath = path.join(walletDir, `${walletName}.json`);
    
    wallet.saveToFile(filePath);
    console.log(`钱包已保存到: ${filePath}`);
  } else {
    console.log('\n警告: 钱包未保存。请记录你的私钥，它不会再显示!');
  }
  
  return { minerAddress: wallet.address, nodeUrl: DEFAULT_NODE_URL };
}

/**
 * 开始挖矿
 * @param {Object} miningInfo - 挖矿信息
 */
async function startMining(miningInfo) {
  const { minerAddress, nodeUrl } = miningInfo;
  
  try {
    console.log(`\n开始挖矿，矿工地址: ${minerAddress}`);
    console.log(`连接到节点: ${nodeUrl}`);
    
    // 发送挖矿请求
    const response = await axios.post(`${nodeUrl}/mine`, { minerAddress });
    
    console.log(`\n${response.data.message}`);
    console.log('挖矿已开始，按 Ctrl+C 停止');
    
    // 定期查询区块链状态
    const interval = setInterval(async () => {
      try {
        const statusResponse = await axios.get(`${nodeUrl}/blockchain`);
        const chainLength = statusResponse.data.chain.length;
        const latestBlock = statusResponse.data.chain[chainLength - 1];
        
        console.log(`\n当前区块高度: ${chainLength - 1}`);
        console.log(`最新区块哈希: ${latestBlock.hash}`);
        console.log(`区块中交易数: ${latestBlock.transactions.length}`);
        console.log(`当前难度: ${statusResponse.data.difficulty}`);
        
        // 查询矿工余额
        const balanceResponse = await axios.get(`${nodeUrl}/balance/${minerAddress}`);
        console.log(`矿工余额: ${balanceResponse.data.balance}`);
        
      } catch (error) {
        console.error('查询区块链状态失败:', error.message);
      }
    }, 10000); // 每10秒更新一次
    
    // 处理用户中断
    process.on('SIGINT', async () => {
      clearInterval(interval);
      
      try {
        await axios.post(`${nodeUrl}/mine/stop`);
        console.log('\n挖矿已停止');
      } catch (error) {
        console.error('停止挖矿失败:', error.message);
      }
      
      rl.close();
      process.exit(0);
    });
    
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
 * 主函数
 */
async function main() {
  try {
    console.log('=== 开始挖矿 ===\n');
    
    // 获取矿工地址
    const miningInfo = await getMinerAddress();
    
    // 确认信息
    console.log(`\n矿工地址: ${miningInfo.minerAddress}`);
    console.log(`节点URL: ${miningInfo.nodeUrl}`);
    
    const confirm = await askQuestion('\n确认开始挖矿? (y/n): ');
    
    if (confirm.toLowerCase() === 'y') {
      await startMining(miningInfo);
      // 注意: 这里不关闭rl，因为挖矿是持续进行的
    } else {
      console.log('挖矿已取消');
      rl.close();
    }
  } catch (error) {
    console.error(`错误: ${error.message}`);
    rl.close();
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('启动挖矿失败:', error);
  rl.close();
  process.exit(1);
});
