/**
 * 启动区块链节点的命令行工具
 * 用于配置并启动一个完整的区块链节点
 */
import Node from '../node.js';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
 * 显示欢迎信息
 */
function showWelcome() {
  console.log('======================================');
  console.log('      Cosmos 简易区块链节点');
  console.log('======================================');
  console.log('这是一个基于 Cosmos SDK 的区块链节点');
  console.log('支持挖矿、交易和最长链验证等功能');
  console.log('======================================\n');
}

/**
 * 获取节点配置
 */
async function getNodeConfig() {
  // 默认配置
  const defaultConfig = {
    httpPort: 3000,
    p2pPort: 6001,
    peers: [],
    minerAddress: null,
    dataDir: path.join(process.cwd(), 'data')
  };
  
  // 尝试从配置文件加载
  const configFileName = process.env.NODE_CONFIG_FILE || 'config.json';
  const configPath = path.join(process.cwd(), configFileName);
  let config = { ...defaultConfig };
  
  // 优先使用环境变量中的数据目录
  if (process.env.DATA_DIR) {
    config.dataDir = process.env.DATA_DIR;
  }
  
  // 优先使用环境变量中的端口
  if (process.env.HTTP_PORT) {
    config.httpPort = parseInt(process.env.HTTP_PORT);
  }
  
  if (process.env.P2P_PORT) {
    config.p2pPort = parseInt(process.env.P2P_PORT);
  }
  
  if (fs.existsSync(configPath)) {
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      const savedConfig = JSON.parse(configData);
      config = { ...defaultConfig, ...savedConfig };
      console.log('已从配置文件加载节点设置');
    } catch (error) {
      console.error('加载配置文件失败，使用默认配置:', error.message);
    }
  }
  
  console.log('\n当前节点配置:');
  console.log(`HTTP端口: ${config.httpPort}`);
  console.log(`P2P端口: ${config.p2pPort}`);
  console.log(`对等节点数: ${config.peers.length}`);
  console.log(`矿工地址: ${config.minerAddress || '未设置'}`);
  console.log(`数据目录: ${config.dataDir}`);
  
  const changeConfig = await askQuestion('\n是否修改配置? (y/n): ');
  
  if (changeConfig.toLowerCase() === 'y') {
    const httpPortInput = await askQuestion(`HTTP端口 (${config.httpPort}): `);
    if (httpPortInput) {
      config.httpPort = parseInt(httpPortInput);
    }
    
    const p2pPortInput = await askQuestion(`P2P端口 (${config.p2pPort}): `);
    if (p2pPortInput) {
      config.p2pPort = parseInt(p2pPortInput);
    }
    
    const peersInput = await askQuestion(`对等节点列表 (逗号分隔): `);
    if (peersInput) {
      config.peers = peersInput.split(',').map(p => p.trim());
    }
    
    const minerAddress = await askQuestion(`矿工地址 (${config.minerAddress || '未设置'}): `);
    if (minerAddress) {
      config.minerAddress = minerAddress;
    }
    
    const dataDir = await askQuestion(`数据目录 (${config.dataDir}): `);
    if (dataDir) {
      config.dataDir = dataDir;
    }
    
    // 保存配置到文件
    const saveConfig = await askQuestion('\n是否保存配置? (y/n): ');
    if (saveConfig.toLowerCase() === 'y') {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('配置已保存到:', configPath);
    }
  }
  
  return config;
}

/**
 * 主函数
 */
async function main() {
  try {
    showWelcome();
    
    // 获取节点配置
    const config = await getNodeConfig();
    
    console.log('\n正在初始化节点...');
    const node = new Node(config);
    
    // 初始化并启动节点
    await node.init();
    await node.start();
    
    console.log('\n节点已成功启动!');
    console.log(`HTTP API 地址: http://localhost:${config.httpPort}`);
    console.log(`P2P 监听地址: /ip4/0.0.0.0/tcp/${config.p2pPort}`);
    
    if (config.minerAddress) {
      console.log(`\n自动挖矿已启动，矿工地址: ${config.minerAddress}`);
    } else {
      console.log('\n提示: 可以使用 npm run start-mining 命令开始挖矿');
    }
    
    console.log('\n按 Ctrl+C 停止节点');
    
    // 处理用户中断
    process.on('SIGINT', async () => {
      console.log('\n正在关闭节点...');
      await node.stop();
      console.log('节点已安全关闭');
      rl.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('启动节点失败:', error);
    rl.close();
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('程序执行失败:', error);
  rl.close();
  process.exit(1);
});
