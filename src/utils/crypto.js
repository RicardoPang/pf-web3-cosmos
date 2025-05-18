/**
 * 加密工具模块
 * 提供哈希计算、签名验证等加密功能
 */
import crypto from 'crypto';
import { sha256 } from '@cosmjs/crypto';
import secp256k1 from 'secp256k1';

/**
 * 计算数据的SHA256哈希值
 * @param {Object|string} data - 需要计算哈希的数据
 * @returns {string} - 返回十六进制格式的哈希值
 */
export function calculateHash(data) {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return sha256(Buffer.from(content)).toString('hex');
}

/**
 * 生成密钥对
 * @returns {Object} - 包含私钥和公钥的对象
 */
export function generateKeyPair() {
  // 生成私钥
  let privateKey;
  do {
    privateKey = crypto.randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privateKey));

  // 从私钥生成公钥
  const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKey));

  return {
    privateKey: privateKey.toString('hex'),
    publicKey: publicKey.toString('hex'),
    address: generateAddress(publicKey)
  };
}

/**
 * 从私钥派生公钥和地址
 * @param {string} privateKeyHex - 十六进制格式的私钥
 * @returns {Object} - 包含公钥和地址的对象
 */
export function deriveFromPrivateKey(privateKeyHex) {
  try {
    // 将十六进制私钥转换为Buffer
    const privateKey = Buffer.from(privateKeyHex, 'hex');
    
    // 验证私钥是否有效
    if (!secp256k1.privateKeyVerify(privateKey)) {
      throw new Error('无效的私钥格式');
    }
    
    // 从私钥生成公钥
    const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKey));
    
    // 生成地址
    return {
      publicKey: publicKey.toString('hex'),
      address: generateAddress(publicKey)
    };
  } catch (error) {
    throw new Error(`从私钥派生失败: ${error.message}`);
  }
}

/**
 * 从公钥生成地址
 * @param {Buffer} publicKey - 公钥
 * @returns {string} - 生成的地址
 */
export function generateAddress(publicKey) {
  const publicKeyBuffer = Buffer.isBuffer(publicKey) ? publicKey : Buffer.from(publicKey, 'hex');
  const hash = crypto.createHash('sha256').update(publicKeyBuffer).digest();
  const ripemd160 = crypto.createHash('ripemd160').update(hash).digest();
  return `cosmos${ripemd160.toString('hex')}`;
}

/**
 * 签名数据
 * @param {string} data - 需要签名的数据
 * @param {string} privateKey - 私钥（十六进制格式）
 * @returns {string} - 签名结果（十六进制格式）
 */
export function sign(data, privateKey) {
  const dataHash = sha256(Buffer.from(typeof data === 'string' ? data : JSON.stringify(data)));
  const privateKeyBuffer = Buffer.from(privateKey, 'hex');
  const signObj = secp256k1.ecdsaSign(dataHash, privateKeyBuffer);
  return Buffer.from(signObj.signature).toString('hex');
}

/**
 * 验证签名
 * @param {string} data - 原始数据
 * @param {string} signature - 签名（十六进制格式）
 * @param {string} publicKey - 公钥（十六进制格式）
 * @returns {boolean} - 验证结果
 */
export function verifySignature(data, signature, publicKey) {
  try {
    const dataHash = sha256(Buffer.from(typeof data === 'string' ? data : JSON.stringify(data)));
    const signatureBuffer = Buffer.from(signature, 'hex');
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');
    return secp256k1.ecdsaVerify(signatureBuffer, dataHash, publicKeyBuffer);
  } catch (error) {
    console.error('验证签名失败:', error);
    return false;
  }
}

/**
 * 生成随机数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} - 生成的随机数
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
