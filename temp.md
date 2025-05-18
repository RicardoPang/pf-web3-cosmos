### 3. 验证最长链演示

最长链验证是区块链共识机制的核心，确保所有节点达成一致的区块链状态。以下是演示最长链验证功能的步骤：

#### 准备工作

1. 确保区块链节点已经启动并正常运行

2. 创建一个测试脚本来演示最长链验证功能：
   ```
   npm run start-node
   ```

#### 最长链验证步骤

1. 创建测试脚本：
   ```bash
   cat > test-longest-chain.js << 'EOF'
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
   EOF
   ```

2. 运行测试脚本：
   ```bash
   node test-longest-chain.js
   ```

3. 观察输出结果：
   - 你将看到两个链被创建，链1有3个区块（1个创世区块+2个普通区块），链2有4个区块（1个创世区块+3个普通区块）
   - 系统会验证两个链的有效性
   - 然后执行最长链验证，链1会被替换为链2，因为链2更长
   - 最后显示替换后的链1，确认它现在包含了链2的所有区块

4. 理解最长链验证的原理：
   - 当区块链系统中出现分叉时，节点会选择最长的有效链作为权威版本
   - 这确保了即使在网络延迟或攻击的情况下，系统也能达成共识
   - 在我们的演示中，链2比链1长，所以系统选择了链2作为权威版本

这个演示展示了区块链系统如何通过最长链规则解决分叉问题，确保所有节点最终达成一致的状态。
