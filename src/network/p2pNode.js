/**
 * P2P网络节点模块
 * 实现节点间的网络通信，包括区块和交易的广播、同步等功能
 */
import { createLibp2p } from 'libp2p';
import tcpModule from 'libp2p-tcp';
import mplexModule from 'libp2p-mplex';
const { TCP } = tcpModule;
const { Mplex } = mplexModule;
import { EventEmitter } from 'events';

/**
 * 消息类型枚举
 */
export const MessageType = {
  QUERY_LATEST: 'QUERY_LATEST', // 请求最新区块
  QUERY_ALL: 'QUERY_ALL', // 请求整个区块链
  RESPONSE_BLOCKCHAIN: 'RESPONSE_BLOCKCHAIN', // 响应区块链数据
  NEW_BLOCK: 'NEW_BLOCK', // 新区块通知
  NEW_TRANSACTION: 'NEW_TRANSACTION' // 新交易通知
};

/**
 * P2P网络节点类
 * 管理与其他节点的连接和通信
 */
export class P2PNode extends EventEmitter {
  /**
   * 创建一个新的P2P网络节点
   * @param {number} port - 监听端口
   * @param {Array} bootstrapPeers - 引导节点列表
   * @param {Blockchain} blockchain - 区块链实例
   */
  constructor(port, bootstrapPeers = [], blockchain) {
    super();
    this.port = port;
    this.peers = new Map(); // 连接的节点
    this.bootstrapPeers = bootstrapPeers; // 引导节点
    this.blockchain = blockchain; // 区块链实例
    this.node = null; // libp2p节点
  }

  /**
   * 初始化P2P节点
   */
  async init() {
    try {
      // 创建libp2p节点
      this.node = await createLibp2p({
        addresses: {
          listen: [`/ip4/0.0.0.0/tcp/${this.port}`]
        },
        transports: [TCP],
        streamMuxers: [Mplex]
      });

      // 设置消息处理器
      this.node.handle('/blockchain/1.0.0', this.handleMessage.bind(this));

      // 启动节点
      await this.node.start();
      console.log(`P2P节点已启动，监听端口: ${this.port}`);

      // 连接到引导节点
      for (const peer of this.bootstrapPeers) {
        this.connectToPeer(peer);
      }

      // 监听区块链事件
      this.blockchain.on('blockMined', (block) => {
        this.broadcastBlock(block);
      });

      this.blockchain.on('transactionAdded', (transaction) => {
        this.broadcastTransaction(transaction);
      });

      return true;
    } catch (error) {
      console.error('初始化P2P节点失败:', error);
      throw error;
    }
  }

  /**
   * 连接到对等节点
   * @param {string} peerMultiaddr - 对等节点的多地址
   */
  async connectToPeer(peerMultiaddr) {
    try {
      const connection = await this.node.dial(peerMultiaddr);
      const peerId = connection.remotePeer.toB58String();
      
      this.peers.set(peerId, connection);
      console.log(`已连接到节点: ${peerId}`);
      
      // 连接成功后，请求最新的区块链数据
      this.sendMessage(peerId, {
        type: MessageType.QUERY_LATEST
      });
      
      return true;
    } catch (error) {
      console.error(`连接到节点失败: ${peerMultiaddr}`, error);
      return false;
    }
  }

  /**
   * 处理接收到的消息
   * @param {Object} stream - 数据流
   */
  async handleMessage({ stream }) {
    const peerId = stream.connection.remotePeer.toB58String();
    
    try {
      // 读取消息
      const message = await this.readMessage(stream);
      
      // 根据消息类型处理
      switch (message.type) {
        case MessageType.QUERY_LATEST:
          this.handleQueryLatest(peerId);
          break;
          
        case MessageType.QUERY_ALL:
          this.handleQueryAll(peerId);
          break;
          
        case MessageType.RESPONSE_BLOCKCHAIN:
          this.handleBlockchainResponse(message.data);
          break;
          
        case MessageType.NEW_BLOCK:
          this.handleNewBlock(message.data);
          break;
          
        case MessageType.NEW_TRANSACTION:
          this.handleNewTransaction(message.data);
          break;
          
        default:
          console.log(`收到未知类型消息: ${message.type}`);
      }
    } catch (error) {
      console.error(`处理消息失败: ${error.message}`);
    }
  }

  /**
   * 从流中读取消息
   * @param {Object} stream - 数据流
   * @returns {Object} - 解析后的消息
   */
  async readMessage(stream) {
    let data = '';
    
    for await (const chunk of stream.source) {
      data += chunk.toString();
    }
    
    return JSON.parse(data);
  }

  /**
   * 发送消息给指定节点
   * @param {string} peerId - 目标节点ID
   * @param {Object} message - 要发送的消息
   */
  async sendMessage(peerId, message) {
    try {
      const connection = this.peers.get(peerId);
      if (!connection) {
        throw new Error(`未连接到节点: ${peerId}`);
      }
      
      const stream = await connection.newStream('/blockchain/1.0.0');
      const data = JSON.stringify(message);
      
      await stream.sink([Buffer.from(data)]);
      await stream.close();
    } catch (error) {
      console.error(`发送消息失败: ${error.message}`);
      // 移除失效的连接
      this.peers.delete(peerId);
    }
  }

  /**
   * 广播消息给所有连接的节点
   * @param {Object} message - 要广播的消息
   */
  broadcastMessage(message) {
    for (const peerId of this.peers.keys()) {
      this.sendMessage(peerId, message);
    }
  }

  /**
   * 处理查询最新区块的请求
   * @param {string} peerId - 请求节点ID
   */
  handleQueryLatest(peerId) {
    const latestBlock = this.blockchain.getLatestBlock();
    this.sendMessage(peerId, {
      type: MessageType.RESPONSE_BLOCKCHAIN,
      data: [latestBlock.toJSON()]
    });
  }

  /**
   * 处理查询整个区块链的请求
   * @param {string} peerId - 请求节点ID
   */
  handleQueryAll(peerId) {
    this.sendMessage(peerId, {
      type: MessageType.RESPONSE_BLOCKCHAIN,
      data: this.blockchain.toJSON()
    });
  }

  /**
   * 处理区块链响应
   * @param {Array} blockchainData - 接收到的区块链数据
   */
  handleBlockchainResponse(blockchainData) {
    if (!Array.isArray(blockchainData) || blockchainData.length === 0) {
      console.error('收到的区块链数据无效');
      return;
    }
    
    try {
      // 将接收到的JSON数据转换为区块对象
      const receivedBlocks = blockchainData.map(blockData => 
        Block.fromJSON(blockData, txData => Transaction.fromJSON(txData))
      );
      
      // 按索引排序
      receivedBlocks.sort((a, b) => a.index - b.index);
      
      const latestReceivedBlock = receivedBlocks[receivedBlocks.length - 1];
      const latestLocalBlock = this.blockchain.getLatestBlock();
      
      // 如果接收到的链不比本地链长，不做处理
      if (latestReceivedBlock.index <= latestLocalBlock.index) {
        console.log('收到的区块链不比本地链长，忽略');
        return;
      }
      
      // 如果接收到的最新区块的前一个区块哈希与本地最新区块哈希相同，
      // 说明只需要添加这个新区块
      if (latestReceivedBlock.previousHash === latestLocalBlock.hash) {
        console.log(`将新区块 #${latestReceivedBlock.index} 添加到链上`);
        this.blockchain.chain.push(latestReceivedBlock);
        
        // 验证更新后的链
        if (this.blockchain.isChainValid()) {
          // 广播最新区块
          this.broadcastBlock(latestReceivedBlock);
          this.emit('blockchainUpdated', this.blockchain);
        } else {
          console.error('添加新区块后链无效，回滚');
          this.blockchain.chain.pop(); // 回滚
        }
      } 
      // 如果接收到的链比本地链长很多，需要替换整个链
      else if (receivedBlocks.length > 1) {
        console.log('收到的区块链比本地链长，替换本地链');
        
        // 创建一个新的区块链实例，用接收到的链替换
        const newBlockchain = new Blockchain();
        newBlockchain.chain = receivedBlocks;
        
        // 验证新链的有效性
        if (newBlockchain.isChainValid()) {
          this.blockchain.chain = receivedBlocks;
          this.emit('blockchainUpdated', this.blockchain);
        } else {
          console.error('收到的区块链无效，保留本地链');
        }
      }
    } catch (error) {
      console.error('处理区块链响应失败:', error);
    }
  }

  /**
   * 处理新区块通知
   * @param {Object} blockData - 新区块数据
   */
  handleNewBlock(blockData) {
    try {
      const newBlock = Block.fromJSON(blockData, txData => Transaction.fromJSON(txData));
      const latestLocalBlock = this.blockchain.getLatestBlock();
      
      // 如果新区块的索引比本地最新区块大1，且前一个区块哈希匹配
      if (newBlock.index === latestLocalBlock.index + 1 && 
          newBlock.previousHash === latestLocalBlock.hash) {
        
        // 验证新区块
        if (newBlock.isValid()) {
          console.log(`添加新区块 #${newBlock.index} 到链上`);
          this.blockchain.chain.push(newBlock);
          
          // 从待处理交易中移除已包含在新区块中的交易
          this.removeProcessedTransactions(newBlock.transactions);
          
          // 广播新区块
          this.broadcastBlock(newBlock);
          this.emit('blockchainUpdated', this.blockchain);
        } else {
          console.error('收到的新区块无效');
        }
      } 
      // 如果新区块的索引比本地最新区块大超过1，请求完整的区块链
      else if (newBlock.index > latestLocalBlock.index + 1) {
        console.log('本地区块链可能落后，请求完整区块链');
        this.broadcastMessage({
          type: MessageType.QUERY_ALL
        });
      }
    } catch (error) {
      console.error('处理新区块失败:', error);
    }
  }

  /**
   * 处理新交易通知
   * @param {Object} transactionData - 新交易数据
   */
  handleNewTransaction(transactionData) {
    try {
      const transaction = Transaction.fromJSON(transactionData);
      
      // 检查交易是否已经在待处理列表中
      const isExisting = this.blockchain.pendingTransactions.some(
        tx => tx.id === transaction.id
      );
      
      if (!isExisting) {
        console.log(`添加新交易 ${transaction.id} 到待处理列表`);
        this.blockchain.pendingTransactions.push(transaction);
        
        // 广播新交易
        this.broadcastTransaction(transaction);
      }
    } catch (error) {
      console.error('处理新交易失败:', error);
    }
  }

  /**
   * 从待处理交易中移除已处理的交易
   * @param {Array} processedTransactions - 已处理的交易
   */
  removeProcessedTransactions(processedTransactions) {
    const processedIds = new Set(processedTransactions.map(tx => tx.id));
    this.blockchain.pendingTransactions = this.blockchain.pendingTransactions.filter(
      tx => !processedIds.has(tx.id)
    );
  }

  /**
   * 广播新区块
   * @param {Block} block - 要广播的区块
   */
  broadcastBlock(block) {
    this.broadcastMessage({
      type: MessageType.NEW_BLOCK,
      data: block.toJSON()
    });
  }

  /**
   * 广播新交易
   * @param {Transaction} transaction - 要广播的交易
   */
  broadcastTransaction(transaction) {
    this.broadcastMessage({
      type: MessageType.NEW_TRANSACTION,
      data: transaction.toJSON()
    });
  }

  /**
   * 关闭P2P节点
   */
  async stop() {
    if (this.node) {
      await this.node.stop();
      console.log('P2P节点已停止');
    }
  }
}
