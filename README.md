# Cosmos 基础区块链项目

## 项目概述

这是一个基于 Cosmos SDK 的基础区块链项目，旨在实现一个简单但功能完整的公链系统。该项目将包含区块链的核心功能，如挖矿、交易处理、账户管理以及共识机制等。通过本地测试环境，用户可以体验区块链的基本运作原理。

## 项目结构

pf-web3-cosmos/
├── API.md # API 接口文档
├── README.md # 项目说明文档
├── package.json # 项目依赖配置
├── src/
│ ├── blockchain/ # 区块链核心模块
│ │ ├── block.js # 区块结构
│ │ ├── blockchain.js # 区块链管理
│ │ └── transaction.js # 交易系统
│ ├── wallet/ # 钱包模块
│ │ └── wallet.js # 钱包功能
│ ├── storage/ # 存储模块
│ │ └── blockchainStorage.js # 区块链数据存储
│ ├── network/ # 网络模块
│ │ └── p2pNode.js # P2P 网络通信
│ ├── utils/ # 工具模块
│ │ └── crypto.js # 加密工具
│ ├── cli/ # 命令行工具
│ │ ├── create-account.js # 创建账户
│ │ ├── send-transaction.js # 发送交易
│ │ ├── start-mining.js # 开始挖矿
│ │ ├── query-blockchain.js # 查询区块链
│ │ └── start-node.js # 启动节点
│ ├── tests/ # 测试模块
│ │ ├── block.test.js # 区块测试
│ │ ├── blockchain.test.js # 区块链测试
│ │ └── transaction.test.js # 交易测试
│ ├── index.js # 主入口文件
│ └── node.js # 节点实现

## 功能需求

### 1. 区块链核心功能

#### 1.1 区块结构设计

- 设计区块头（Block Header）：包含版本号、前一区块哈希、时间戳、难度目标、随机数等信息
- 设计区块体（Block Body）：包含交易列表、验证信息等
- 实现区块的序列化和反序列化功能

#### 1.2 账户系统

- 实现基于公私钥对的账户创建功能
- 支持账户余额查询
- 实现账户状态管理
- 提供账户导入导出功能

#### 1.3 交易系统

- 支持基础的代币转账交易
- 实现交易的签名和验证机制
- 支持交易费用计算
- 提供交易历史查询功能

#### 1.4 共识机制

- 实现简化版的工作量证明（PoW）共识算法
- 支持挖矿难度自动调整
- 实现区块奖励机制
- 支持最长链验证和选择

### 2. 网络功能

#### 2.1 P2P 网络

- 实现节点发现和连接机制
- 支持区块和交易的广播
- 实现节点间的数据同步

#### 2.2 API 接口

- 提供 RESTful API 接口，用于与区块链交互
- 支持查询区块、交易、账户信息
- 提供交易提交接口

### 3. 存储系统

- 实现区块数据的持久化存储
- 支持账户状态的存储和更新
- 实现简单的数据索引，提高查询效率

## 技术实现细节

### 开发环境

- 编程语言：JavaScript/Node.js
- 框架：Cosmos SDK
- 数据库：LevelDB（用于区块链数据存储）
- 网络库：libp2p（用于 P2P 网络通信）

### 核心模块设计

#### 区块链模块

```
- 区块创建与验证
- 区块链状态管理
- 共识规则实现
- 分叉处理逻辑
```

#### 挖矿模块

```
- 工作量证明算法实现
- 区块奖励计算
- 难度调整算法
- 挖矿任务调度
```

#### 交易处理模块

```
- 交易创建与签名
- 交易验证与执行
- 交易池管理
- UTXO或账户模型实现
```

#### 网络通信模块

```
- 节点发现与连接
- 消息广播与接收
- 数据同步机制
- 网络安全措施
```

## 实现步骤

### 第一阶段：基础架构搭建

1. 设置项目结构和依赖
2. 实现基本的区块和区块链数据结构
3. 实现简单的存储系统

### 第二阶段：核心功能实现

1. 实现工作量证明挖矿算法
2. 实现交易创建、签名和验证
3. 实现账户系统和余额管理
4. 开发最长链验证和选择机制

### 第三阶段：网络功能开发

1. 实现 P2P 网络通信
2. 开发节点发现和连接机制
3. 实现区块和交易的广播功能
4. 开发数据同步机制

### 第四阶段：API 和用户界面

1. 设计和实现 RESTful API
2. 开发简单的命令行界面
3. 提供基本的区块浏览功能

## 测试计划

### 单元测试

- 区块创建与验证测试
- 交易签名与验证测试
- 共识算法测试

### 集成测试

- 多节点网络测试
- 区块同步测试
- 分叉处理测试

### 性能测试

- 交易处理性能测试
- 区块生成速度测试
- 网络传输效率测试

## 使用说明

### 环境准备

```
1. 安装Node.js (v14+)
2. 克隆项目代码
3. 安装依赖：npm install
```

### 启动节点

```
npm run start-node
```

### 创建账户

```
npm run create-account
```

### 发送交易

```
npm run send-tx <发送方地址> <接收方地址> <金额>
```

### 开始挖矿

```
npm run start-mining <矿工地址>
```

### 查询区块链状态

```
npm run query-blockchain
```

## 功能演示指南

以下是经过实际验证的区块链核心功能演示步骤，包括挖矿、转账和最长链验证。这些步骤已经过测试，确保可以顺利运行。

### 1. 准备工作

1. 确保已安装 Node.js (v14+)
2. 克隆项目并安装依赖：
   ```bash
   git clone https://github.com/yourusername/pf-web3-cosmos.git
   cd pf-web3-cosmos
   npm install
   ```

3. 启动本地测试网络（在终端1中运行）：
   ```bash
   npm run start-node
   ```
   此命令将启动一个区块链节点，默认监听 HTTP 端口 3000 和 P2P 端口 5000。

### 2. 挖矿演示

1. **创建矿工钱包**
   
   在新的终端窗口（终端2）中运行：
   ```bash
   echo -e "y\nminer" | npm run create-account
   ```
   系统会在 `data/wallets` 目录下创建一个钱包文件 `miner.json`。

2. **更新配置文件**

   将创建的矿工地址添加到配置文件中：
   ```bash
   # 打开配置文件
   cat ./data/wallets/miner.json
   # 复制地址并更新config.json文件中的minerAddress字段
   ```

3. **重启节点**

   停止当前节点并重新启动：
   ```bash
   # 停止当前节点（如果有运行）
   pkill -f "node src/cli/start-node.js"
   # 重新启动节点
   echo "n" | npm run start-node
   ```

4. **观察挖矿过程**
   在节点运行日志中，您将看到类似以下输出：
   ```
   开始挖掘区块 #1...
   区块 #1 挖掘成功! 哈希: 0,36,156,135,77,120,198,216,128,59,227,72,204,249,216,223,120,37,80,161,228,114,227,233,133,14,62,140,75,163,116,199
   区块链数据保存成功
   新区块已挖出: #1, 哈希: 0,36,156,135,77,120,198,216,128,59,227,72,204,249,216,223,120,37,80,161,228,114,227,233,133,14,62,140,75,163,116,199
   ```

5. **查询矿工余额**
   
   等待挖出几个区块后，在新的终端窗口（终端3）中运行：
   ```bash
   # 替换为您的矿工地址
   curl http://localhost:3001/balance/cosmos83b4c76c07e632b1fdd401c5b2c724c8e5672048
   ```
   
   您将看到矿工地址的余额，每挖出一个区块将获得50个代币的奖励。

### 3. 转账演示

1. **创建接收方钱包**
   
   在终端3中运行：
   ```bash
   echo -e "y\nreceiver" | npm run create-account
   ```
   系统会在 `data/wallets` 目录下创建一个钱包文件 `receiver.json`。

2. **查看钱包信息**
   
   查看矿工和接收方的钱包信息：
   ```bash
   cat ./data/wallets/miner.json
   cat ./data/wallets/receiver.json
   ```
   记录两个地址和矿工的私钥，用于后续的转账操作。

3. **发送交易**
   
   从矿工向接收方发送交易（替换为您的实际地址和私钥）：
   ```bash
   echo "y" | npm run send-tx \
     cosmos83b4c76c07e632b1fdd401c5b2c724c8e5672048 \
     cosmos451c575691dca55e79086df43b655f3af6836aa0 \
     50 \
     df34c02150b6c5a9c4e67979cd5965fe8ed8003ee94473b4769a49db6e8ec17f \
     http://localhost:3001
   ```
   
   > 注意：上面的命令包含以下参数：
   > - 发送方地址
   > - 接收方地址
   > - 转账金额（50个代币）
   > - 发送方私钥（用于签名交易）
   > - 节点URL（指定节点的HTTP端口）

4. **确认交易**
   
   交易提交后，等待几秒钟（等待矿工将交易打包到区块中），然后查询接收方余额：
   ```bash
   curl http://localhost:3001/balance/cosmos451c575691dca55e79086df43b655f3af6836aa0
   ```
   
   您应该能看到接收方已经收到了50个代币。

### 4. 验证最长链

1. **创建第二个节点的配置文件**
   
   在新的终端窗口（终端4）中创建第二个节点的配置文件：
   ```bash
   cat > config2.json << EOF
   {
     "httpPort": 3002,
     "p2pPort": 5002,
     "peers": [],
     "minerAddress": "cosmos83b4c76c07e632b1fdd401c5b2c724c8e5672048",
     "dataDir": "./data2",
     "difficulty": 1
   }
   EOF
   ```

2. **创建第二个节点的数据目录**
   
   ```bash
   mkdir -p ./data2/blockchain ./data2/wallets
   ```

3. **启动第二个节点**
   
   修改 start-node.js 脚本，使其能够从环境变量中读取配置文件路径：
   ```bash
   # 修改 start-node.js 脚本，将以下行：
   # const configPath = path.join(process.cwd(), 'config.json');
   # 替换为：
   # const configFileName = process.env.NODE_CONFIG_FILE || 'config.json';
   # const configPath = path.join(process.cwd(), configFileName);
   ```
   
   启动第二个节点：
   ```bash
   echo "n" | NODE_CONFIG_FILE=config2.json npm run start-node
   ```
   这将启动第二个区块链节点，使用不同的端口避免冲突。您应该能看到类似以下输出：
   ```
   节点已成功启动!
   HTTP API 地址: http://localhost:3002
   P2P 监听地址: /ip4/0.0.0.0/tcp/5002
   
   自动挖矿已启动，矿工地址: cosmos83b4c76c07e632b1fdd401c5b2c724c8e5672048
   ```

4. **观察两个节点的区块链状态**
   
   查看第一个节点的区块链：
   ```bash
   curl http://localhost:3001/blockchain
   ```
   
   查看第二个节点的区块链：
   ```bash
   curl http://localhost:3002/blockchain
   ```
   
   您将看到两个节点有不同的区块链状态（分叉）。第一个节点的区块链已经有多个区块，而第二个节点刚刚开始挖矿，只有几个区块。

5. **等待最长链验证生效**
   
   继续让两个节点运行一段时间（约 1-2 分钟），然后再次查询两个节点的区块链状态：
   
   ```bash
   # 查看第一个节点的区块链
   curl http://localhost:3001/blockchain | grep '"index"' | wc -l
   
   # 查看第二个节点的区块链
   curl http://localhost:3002/blockchain | grep '"index"' | wc -l
   ```
   
   上面的命令将显示每个节点的区块数量。随着时间的推移，您将观察到两个节点的区块链长度会不断变化。

6. **验证最长链机制**

   要测试最长链机制，我们需要分别启动两个节点，然后停止其中一个，让另一个继续挖矿并创建更长的链。以下是一种简化的测试方法：
   
   **准备工作：**
   
   首先，确保你有两个配置文件和数据目录：
   
   1. 第一个节点：`config.json` 和 `./data` 目录
   2. 第二个节点：`config2.json` 和 `./data2` 目录
   
   确保这两个配置文件中的端口设置不同，例如：
   - 第一个节点：`httpPort: 3000, p2pPort: 5000`
   - 第二个节点：`httpPort: 3001, p2pPort: 5001`
   
   确保每个节点的数据目录中都有矿工钱包：
   
   ```bash
   # 创建第二个节点的数据目录
   mkdir -p ./data2/blockchain ./data2/wallets
   
   # 为第二个节点创建矿工钱包
   echo -e "y\nminer2" | npm run create-account
   
   # 将钱包复制到第二个节点的数据目录
   cp ./data/wallets/miner2.json ./data2/wallets/miner.json
   ```
   
   **测试步骤：**
   
   1. **先停止所有节点（如果有的话）**
   
   ```bash
   pkill -f "node src/cli/start-node.js"
   ```
   
   2. **在第一个终端启动第一个节点**
   
   ```bash
   # 启动第一个节点
   echo "n" | npm run start-node
   ```
   
   3. **在第二个终端启动第二个节点**
   
   ```bash
   # 启动第二个节点
   NODE_CONFIG_FILE=config2.json DATA_DIR=./data2 echo "n" | npm run start-node
   ```
   
   4. **等待两个节点都挖出一些区块**
   
   使用以下命令检查两个节点的区块链状态：
   
   ```bash
   # 查看第一个节点的区块链
   curl http://localhost:3000/blockchain | grep -o '"index":[0-9]*' | tail -n 1
   
   # 查看第二个节点的区块链
   curl http://localhost:3001/blockchain | grep -o '"index":[0-9]*' | tail -n 1
   ```
   
   5. **在第一个终端中停止第一个节点**
   
   在第一个终端中按 `Ctrl+C` 停止第一个节点。
   
   6. **等待第二个节点挖出更多区块**
   
   等待约 30 秒，让第二个节点有足够的时间挖出更多区块。
   
   7. **重新启动第一个节点**
   
   ```bash
   # 重新启动第一个节点
   echo "n" | npm run start-node
   ```
   
   8. **验证最长链机制**
   
   等待几秒钟让第一个节点同步数据，然后比较两个节点的区块链：
   
   ```bash
   # 查看第一个节点的区块链哈希
   curl http://localhost:3000/blockchain | grep -o '"hash":"[^"]*"' | head -n 5
   
   # 查看第二个节点的区块链哈希
   curl http://localhost:3001/blockchain | grep -o '"hash":"[^"]*"' | head -n 5
   ```
   
   比较两个节点的区块哈希，您将看到它们已经一致，这说明最长链验证机制已经生效。第一个节点在重新启动后会采用第二个节点的链，因为它更长。

### 5. 实用提示

1. **停止节点和挖矿**
   
   停止所有节点：
   ```bash
   pkill -f "node src/cli/start-node.js"
   ```

2. **重置区块链**
   
   如果需要重新开始测试，可以删除数据目录：
   ```bash
   # 删除第一个节点的区块链数据
   rm -rf ./data/blockchain
   mkdir -p ./data/blockchain
   
   # 删除第二个节点的区块链数据（如果有）
   rm -rf ./data2/blockchain
   mkdir -p ./data2/blockchain
   ```
   
   > 注意：这将删除所有区块链数据，但保留钱包文件

3. **查询交易和余额**
   
   查询所有交易：
   ```bash
   curl http://localhost:3001/transactions
   ```
   
   查询特定地址的交易历史：
   ```bash
   curl http://localhost:3001/address/cosmos83b4c76c07e632b1fdd401c5b2c724c8e5672048/transactions
   ```
   
   查询地址余额：
   ```bash
   curl http://localhost:3001/balance/cosmos83b4c76c07e632b1fdd401c5b2c724c8e5672048
   ```

4. **排除常见问题**

   如果遇到数据库错误：
   ```
   ModuleError: Database is not open
   ```
   
   解决方法：
   ```bash
   # 确保数据目录存在并有正确的权限
   mkdir -p ./data/blockchain
   # 重启节点
   echo "n" | npm run start-node
   ```

5. **使用不同端口运行多个节点**

   当运行多个节点时，记得使用不同的端口和数据目录：
   ```bash
   # 第一个节点
   # HTTP端口: 3001, P2P端口: 5001, 数据目录: ./data
   
   # 第二个节点
   # HTTP端口: 3002, P2P端口: 5002, 数据目录: ./data2
   ```

## 常见问题解决

1. **交易未被确认**
   - 确保矿工正在运行并成功挖矿
   - 检查发送方余额是否足够
   - 确认交易参数格式正确

2. **节点同步问题**
   - 确保节点间的网络连接正常
   - 检查P2P端口是否正确配置
   - 重启有问题的节点

3. **挖矿没有奖励**
   - 确认矿工地址格式正确
   - 检查区块链数据是否完整
   - 查看系统日志了解详细错误信息
