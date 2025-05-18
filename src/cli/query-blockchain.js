/**
 * 查询区块链状态命令行工具
 * 用于查询区块链的各种信息，如区块、交易、账户余额等
 */
import axios from 'axios';
import readline from 'readline';

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
 * 显示主菜单
 */
async function showMainMenu() {
  console.log('\n=== 区块链查询工具 ===');
  console.log('1. 查看区块链概况');
  console.log('2. 查询特定区块');
  console.log('3. 查询账户余额');
  console.log('4. 查询交易历史');
  console.log('5. 查看节点信息');
  console.log('0. 退出');
  
  const choice = await askQuestion('\n请选择操作 (0-5): ');
  return choice;
}

/**
 * 查询区块链概况
 * @param {string} nodeUrl - 节点URL
 */
async function getBlockchainOverview(nodeUrl) {
  try {
    const response = await axios.get(`${nodeUrl}/blockchain`);
    const data = response.data;
    
    console.log('\n=== 区块链概况 ===');
    console.log(`区块数量: ${data.chain.length}`);
    console.log(`当前难度: ${data.difficulty}`);
    console.log(`待处理交易: ${data.pendingTransactions.length}`);
    console.log(`是否正在挖矿: ${data.isMining ? '是' : '否'}`);
    
    // 显示最新区块信息
    const latestBlock = data.chain[data.chain.length - 1];
    console.log('\n最新区块:');
    console.log(`高度: ${latestBlock.index}`);
    console.log(`哈希: ${latestBlock.hash}`);
    console.log(`时间戳: ${new Date(latestBlock.timestamp).toLocaleString()}`);
    console.log(`交易数: ${latestBlock.transactions.length}`);
    
  } catch (error) {
    handleApiError(error, nodeUrl);
  }
}

/**
 * 查询特定区块
 * @param {string} nodeUrl - 节点URL
 */
async function getBlockDetails(nodeUrl) {
  try {
    const blockIndex = await askQuestion('请输入区块高度: ');
    
    if (isNaN(blockIndex) || blockIndex < 0) {
      console.log('无效的区块高度');
      return;
    }
    
    const response = await axios.get(`${nodeUrl}/block/${blockIndex}`);
    const block = response.data;
    
    console.log('\n=== 区块详情 ===');
    console.log(`高度: ${block.index}`);
    console.log(`哈希: ${block.hash}`);
    console.log(`前一区块哈希: ${block.previousHash}`);
    console.log(`时间戳: ${new Date(block.timestamp).toLocaleString()}`);
    console.log(`难度: ${block.difficulty}`);
    console.log(`随机数: ${block.nonce}`);
    console.log(`默克尔根: ${block.merkleRoot}`);
    
    console.log(`\n交易数量: ${block.transactions.length}`);
    
    if (block.transactions.length > 0) {
      const showTransactions = await askQuestion('是否显示交易详情? (y/n): ');
      
      if (showTransactions.toLowerCase() === 'y') {
        console.log('\n交易列表:');
        block.transactions.forEach((tx, index) => {
          console.log(`\n交易 #${index + 1}:`);
          console.log(`ID: ${tx.id}`);
          console.log(`类型: ${tx.type}`);
          console.log(`发送方: ${tx.fromAddress || '系统(挖矿奖励)'}`);
          console.log(`接收方: ${tx.toAddress}`);
          console.log(`金额: ${tx.amount}`);
          console.log(`时间戳: ${new Date(tx.timestamp).toLocaleString()}`);
        });
      }
    }
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('区块不存在');
    } else {
      handleApiError(error, nodeUrl);
    }
  }
}

/**
 * 查询账户余额
 * @param {string} nodeUrl - 节点URL
 */
async function getAccountBalance(nodeUrl) {
  try {
    const address = await askQuestion('请输入账户地址: ');
    
    if (!address) {
      console.log('地址不能为空');
      return;
    }
    
    const response = await axios.get(`${nodeUrl}/balance/${address}`);
    
    console.log('\n=== 账户余额 ===');
    console.log(`地址: ${response.data.address}`);
    console.log(`余额: ${response.data.balance}`);
    
  } catch (error) {
    handleApiError(error, nodeUrl);
  }
}

/**
 * 查询交易历史
 * @param {string} nodeUrl - 节点URL
 */
async function getTransactionHistory(nodeUrl) {
  try {
    const address = await askQuestion('请输入账户地址: ');
    
    if (!address) {
      console.log('地址不能为空');
      return;
    }
    
    const response = await axios.get(`${nodeUrl}/transactions/${address}`);
    const transactions = response.data.transactions;
    
    console.log('\n=== 交易历史 ===');
    console.log(`地址: ${address}`);
    console.log(`交易数量: ${transactions.length}`);
    
    if (transactions.length === 0) {
      console.log('没有交易记录');
      return;
    }
    
    transactions.forEach((tx, index) => {
      console.log(`\n交易 #${index + 1}:`);
      console.log(`ID: ${tx.id}`);
      console.log(`区块: #${tx.blockIndex} (${tx.blockHash.substring(0, 10)}...)`);
      console.log(`类型: ${tx.type}`);
      
      if (tx.fromAddress === address) {
        console.log(`发送到: ${tx.toAddress}`);
        console.log(`金额: -${tx.amount}`);
      } else {
        console.log(`接收自: ${tx.fromAddress || '系统(挖矿奖励)'}`);
        console.log(`金额: +${tx.amount}`);
      }
      
      console.log(`时间: ${new Date(tx.timestamp).toLocaleString()}`);
    });
    
  } catch (error) {
    handleApiError(error, nodeUrl);
  }
}

/**
 * 查看节点信息
 * @param {string} nodeUrl - 节点URL
 */
async function getNodeInfo(nodeUrl) {
  try {
    const response = await axios.get(`${nodeUrl}/node/info`);
    const nodeInfo = response.data;
    
    console.log('\n=== 节点信息 ===');
    console.log(`HTTP端口: ${nodeInfo.httpPort}`);
    console.log(`P2P端口: ${nodeInfo.p2pPort}`);
    console.log(`矿工地址: ${nodeInfo.minerAddress || '未设置'}`);
    console.log(`是否正在挖矿: ${nodeInfo.isMining ? '是' : '否'}`);
    
    console.log(`\n连接的对等节点数: ${nodeInfo.peers.length}`);
    if (nodeInfo.peers.length > 0) {
      console.log('对等节点列表:');
      nodeInfo.peers.forEach((peer, index) => {
        console.log(`${index + 1}. ${peer}`);
      });
    }
    
  } catch (error) {
    handleApiError(error, nodeUrl);
  }
}

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @param {string} nodeUrl - 节点URL
 */
function handleApiError(error, nodeUrl) {
  if (error.response) {
    console.error(`服务器错误: ${error.response.data.error || error.response.statusText}`);
  } else if (error.request) {
    console.error(`无法连接到节点: ${nodeUrl}`);
  } else {
    console.error(`错误: ${error.message}`);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 获取节点URL
    const args = process.argv.slice(2);
    const nodeUrl = args[0] || await askQuestion(`节点URL (默认: ${DEFAULT_NODE_URL}): `) || DEFAULT_NODE_URL;
    
    let running = true;
    
    while (running) {
      const choice = await showMainMenu();
      
      switch (choice) {
        case '1':
          await getBlockchainOverview(nodeUrl);
          break;
          
        case '2':
          await getBlockDetails(nodeUrl);
          break;
          
        case '3':
          await getAccountBalance(nodeUrl);
          break;
          
        case '4':
          await getTransactionHistory(nodeUrl);
          break;
          
        case '5':
          await getNodeInfo(nodeUrl);
          break;
          
        case '0':
          console.log('退出程序');
          running = false;
          break;
          
        default:
          console.log('无效的选择，请重试');
      }
      
      if (running) {
        await askQuestion('\n按回车键继续...');
      }
    }
    
    rl.close();
    
  } catch (error) {
    console.error(`错误: ${error.message}`);
    rl.close();
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('查询区块链失败:', error);
  rl.close();
  process.exit(1);
});
