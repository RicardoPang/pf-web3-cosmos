/**
 * 创建账户命令行工具
 * 用于生成新的区块链账户（钱包）
 */
import { Wallet } from '../wallet/wallet.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 确保钱包目录存在
const walletDir = path.join(process.cwd(), 'data', 'wallets');
if (!fs.existsSync(walletDir)) {
  fs.mkdirSync(walletDir, { recursive: true });
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 创建新账户 ===');
  
  // 生成新钱包
  const wallet = new Wallet();
  
  console.log('\n新账户已创建:');
  console.log(`地址: ${wallet.address}`);
  console.log(`公钥: ${wallet.publicKey}`);
  console.log(`私钥: ${wallet.privateKey}`);
  
  // 询问是否保存钱包
  rl.question('\n是否保存此钱包到文件? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      // 询问钱包名称
      rl.question('请输入钱包名称: ', (walletName) => {
        const fileName = `${walletName || 'wallet'}.json`;
        const filePath = path.join(walletDir, fileName);
        
        // 保存钱包
        wallet.saveToFile(filePath);
        
        console.log(`\n钱包已保存到: ${filePath}`);
        console.log('\n重要提示: 请妥善保管你的私钥，不要泄露给任何人!');
        rl.close();
      });
    } else {
      console.log('\n钱包未保存。请记录你的私钥，它不会再显示!');
      rl.close();
    }
  });
}

// 运行主函数
main().catch(error => {
  console.error('创建账户失败:', error);
  rl.close();
  process.exit(1);
});
