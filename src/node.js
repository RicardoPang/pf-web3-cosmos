/**
 * 区块链节点
 * 整合区块链、存储、网络等组件，提供完整的节点功能
 */
import express from 'express';
import { fileURLToPath } from 'url';
import { Blockchain } from './blockchain/blockchain.js';
import { Transaction } from './blockchain/transaction.js';
import { BlockchainStorage } from './storage/blockchainStorage.js';
import { P2PNode } from './network/p2pNode.js';
import { Wallet } from './wallet/wallet.js';
import path from 'path';
import fs from 'fs';

// 默认配置
const DEFAULT_HTTP_PORT = 3000;
const DEFAULT_P2P_PORT = 6001;
const DEFAULT_PEERS = [];

/**
 * 区块链节点类
 * 管理区块链的运行和对外接口
 */
class Node {
  /**
   * 创建一个新的区块链节点
   * @param {Object} options - 节点配置选项
   */
  constructor(options = {}) {
    this.httpPort = options.httpPort || DEFAULT_HTTP_PORT;
    this.p2pPort = options.p2pPort || DEFAULT_P2P_PORT;
    this.peers = options.peers || DEFAULT_PEERS;
    this.minerAddress = options.minerAddress || null;
    this.dataDir = options.dataDir || './data';
    
    // 确保数据目录存在
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // 初始化组件
    this.storage = new BlockchainStorage(path.join(this.dataDir, 'blockchain'));
    this.blockchain = null;
    this.p2pNode = null;
    this.app = express();
    this.miningInterval = null;
    this.isMining = false;
  }

  /**
   * 初始化节点
   */
  async init() {
    try {
      // 加载或创建区块链
      this.blockchain = await this.storage.loadBlockchain();
      
      // 暂时禁用 P2P 网络功能，以便区块链的其他核心功能能够正常工作
      console.log('注意: P2P 网络功能已禁用，仅支持单节点模式');
      this.p2pNode = null;
      
      // 设置区块链事件监听
      this.blockchain.on('blockchainUpdated', async () => {
        await this.storage.saveBlockchain(this.blockchain);
      });
      
      // 设置API路由
      this.setupAPI();
      
      console.log('节点初始化完成');
      return true;
    } catch (error) {
      console.error('节点初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置API路由
   */
  setupAPI() {
    this.app.use(express.json());
    
    // 获取区块链信息
    this.app.get('/blockchain', (req, res) => {
      res.json({
        chain: this.blockchain.toJSON(),
        difficulty: this.blockchain.difficulty,
        pendingTransactions: this.blockchain.pendingTransactions.map(tx => tx.toJSON()),
        isMining: this.isMining
      });
    });
    
    // 获取特定区块
    this.app.get('/block/:index', (req, res) => {
      const index = parseInt(req.params.index);
      if (index < 0 || index >= this.blockchain.chain.length) {
        return res.status(404).json({ error: '区块不存在' });
      }
      
      res.json(this.blockchain.chain[index].toJSON());
    });
    
    // 获取账户余额
    this.app.get('/balance/:address', (req, res) => {
      const { address } = req.params;
      const balance = this.blockchain.getBalanceOfAddress(address);
      res.json({ address, balance });
    });
    
    // 获取账户交易历史
    this.app.get('/transactions/:address', (req, res) => {
      const { address } = req.params;
      const transactions = this.blockchain.getTransactionsForAddress(address);
      res.json({ address, transactions });
    });
    
    // 创建新交易
    this.app.post('/transaction', (req, res) => {
      try {
        const { fromAddress, toAddress, amount, privateKey } = req.body;
        
        if (!fromAddress || !toAddress || !amount || !privateKey) {
          return res.status(400).json({ error: '缺少必要参数' });
        }
        
        // 创建钱包和交易
        const wallet = new Wallet(privateKey);
        if (wallet.address !== fromAddress) {
          return res.status(400).json({ error: '私钥与发送地址不匹配' });
        }
        
        const transaction = wallet.createTransaction(toAddress, parseFloat(amount));
        this.blockchain.addTransaction(transaction);
        
        res.status(201).json({
          message: '交易创建成功',
          transaction: transaction.toJSON()
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // 开始挖矿
    this.app.post('/mine', (req, res) => {
      const { minerAddress } = req.body;
      
      if (!minerAddress) {
        return res.status(400).json({ error: '缺少矿工地址' });
      }
      
      if (this.isMining) {
        return res.status(400).json({ error: '已经在挖矿中' });
      }
      
      // 设置矿工地址并开始挖矿
      this.minerAddress = minerAddress;
      this.startMining();
      
      res.json({ message: '挖矿已开始', minerAddress });
    });
    
    // 停止挖矿
    this.app.post('/mine/stop', (req, res) => {
      this.stopMining();
      res.json({ message: '挖矿已停止' });
    });
    
    // 获取节点信息
    this.app.get('/node/info', (req, res) => {
      res.json({
        httpPort: this.httpPort,
        p2pPort: this.p2pPort,
        peers: [],  // 单节点模式下没有对等节点
        minerAddress: this.minerAddress,
        isMining: this.isMining
      });
    });
    
    // 添加对等节点 (单节点模式下仅返回消息)
    this.app.post('/node/peers', (req, res) => {
      const { peer } = req.body;
      
      if (!peer) {
        return res.status(400).json({ error: '缺少对等节点地址' });
      }
      
      // 在单节点模式下，只返回信息消息
      res.json({ 
        message: '当前运行在单节点模式，P2P 功能已禁用', 
        peer 
      });
    });
  }

  /**
   * 启动节点
   */
  async start() {
    try {
      // 启动HTTP服务器
      this.app.listen(this.httpPort, () => {
        console.log(`HTTP服务器已启动，监听端口: ${this.httpPort}`);
      });
      
      // 如果设置了矿工地址，开始挖矿
      if (this.minerAddress) {
        this.startMining();
      }
      
      console.log('节点已启动');
      return true;
    } catch (error) {
      console.error('启动节点失败:', error);
      throw error;
    }
  }

  /**
   * 开始挖矿
   */
  startMining() {
    if (this.isMining || !this.minerAddress) {
      return;
    }
    
    this.isMining = true;
    console.log(`开始挖矿，矿工地址: ${this.minerAddress}`);
    
    // 设置挖矿间隔
    this.miningInterval = setInterval(async () => {
      // 如果没有待处理交易，添加一个空交易
      if (this.blockchain.pendingTransactions.length === 0) {
        const emptyTx = new Transaction(null, this.minerAddress, 0, 'empty');
        this.blockchain.pendingTransactions.push(emptyTx);
      }
      
      // 挖掘新区块
      const newBlock = this.blockchain.minePendingTransactions(this.minerAddress);
      
      // 调整难度
      this.blockchain.adjustDifficulty();
      
      // 保存区块链
      await this.storage.saveBlockchain(this.blockchain);
      
      console.log(`新区块已挖出: #${newBlock.index}, 哈希: ${newBlock.hash}`);
    }, 5000); // 每5秒尝试挖掘一个新区块
  }

  /**
   * 停止挖矿
   */
  stopMining() {
    if (!this.isMining) {
      return;
    }
    
    clearInterval(this.miningInterval);
    this.isMining = false;
    console.log('挖矿已停止');
  }

  /**
   * 关闭节点
   */
  async stop() {
    try {
      // 停止挖矿
      this.stopMining();
      
      // 保存区块链
      await this.storage.saveBlockchain(this.blockchain);
      
      // 关闭数据库
      await this.storage.close();
      
      // P2P节点已禁用，无需停止
      
      console.log('节点已关闭');
      return true;
    } catch (error) {
      console.error('关闭节点失败:', error);
      throw error;
    }
  }
}

// 如果直接运行此文件，启动节点
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = {
    httpPort: parseInt(process.env.HTTP_PORT) || DEFAULT_HTTP_PORT,
    p2pPort: parseInt(process.env.P2P_PORT) || DEFAULT_P2P_PORT,
    peers: process.env.PEERS ? process.env.PEERS.split(',') : DEFAULT_PEERS,
    minerAddress: process.env.MINER_ADDRESS || null,
    dataDir: process.env.DATA_DIR || './data'
  };
  
  const node = new Node(options);
  
  // 处理进程退出
  process.on('SIGINT', async () => {
    console.log('正在关闭节点...');
    await node.stop();
    process.exit(0);
  });
  
  // 启动节点
  node.init()
    .then(() => node.start())
    .catch(error => {
      console.error('启动节点失败:', error);
      process.exit(1);
    });
}

export default Node;
