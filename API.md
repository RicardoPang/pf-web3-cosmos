# 区块链 API 接口文档

本文档描述了区块链系统提供的 HTTP API 接口，你可以通过这些接口与区块链进行交互。

## 基本信息

- 默认 API 地址：`http://localhost:3000`
- 所有请求和响应均使用 JSON 格式

## 接口列表

### 1. 获取区块链信息

**请求**：

```
GET /blockchain
```

**响应示例**：

```json
{
  "chain": [
    {
      "index": 0,
      "timestamp": 1621500000000,
      "previousHash": "0000000000000000000000000000000000000000000000000000000000000000",
      "hash": "04a1a2c96c21a4c8e8ca31955072d3569d0b93d36453a5e4617c7fcba9bd4224",
      "nonce": 0,
      "difficulty": 2,
      "merkleRoot": "0000000000000000000000000000000000000000000000000000000000000000",
      "transactions": []
    }
    // 更多区块...
  ],
  "difficulty": 2,
  "pendingTransactions": [
    // 待处理的交易...
  ],
  "isMining": true
}
```

### 2. 获取特定区块

**请求**：

```
GET /block/:index
```

**参数**：

- `index`：区块索引（高度）

**响应示例**：

```json
{
  "index": 1,
  "timestamp": 1621500100000,
  "previousHash": "04a1a2c96c21a4c8e8ca31955072d3569d0b93d36453a5e4617c7fcba9bd4224",
  "hash": "07b2e4c8a9d3f5e6b1c2a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
  "nonce": 12345,
  "difficulty": 2,
  "merkleRoot": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
  "transactions": [
    {
      "id": "tx123456",
      "fromAddress": null,
      "toAddress": "cosmos1abc...",
      "amount": 50,
      "timestamp": 1621500050000,
      "type": "reward",
      "signature": null
    }
    // 更多交易...
  ]
}
```

### 3. 获取账户余额

**请求**：

```
GET /balance/:address
```

**参数**：

- `address`：账户地址

**响应示例**：

```json
{
  "address": "cosmos1abc...",
  "balance": 150
}
```

### 4. 获取账户交易历史

**请求**：

```
GET /transactions/:address
```

**参数**：

- `address`：账户地址

**响应示例**：

```json
{
  "address": "cosmos1abc...",
  "transactions": [
    {
      "id": "tx123456",
      "fromAddress": null,
      "toAddress": "cosmos1abc...",
      "amount": 50,
      "timestamp": 1621500050000,
      "type": "reward",
      "signature": null,
      "blockIndex": 1,
      "blockHash": "07b2e4c8a9d3f5e6b1c2a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4"
    }
    // 更多交易...
  ]
}
```

### 5. 创建新交易

**请求**：

```
POST /transaction
```

**请求体**：

```json
{
  "fromAddress": "cosmos1abc...",
  "toAddress": "cosmos1def...",
  "amount": 10,
  "privateKey": "abcdef123456..."
}
```

**响应示例**：

```json
{
  "message": "交易创建成功",
  "transaction": {
    "id": "tx789012",
    "fromAddress": "cosmos1abc...",
    "toAddress": "cosmos1def...",
    "amount": 10,
    "timestamp": 1621500200000,
    "type": "regular",
    "signature": "3045022100..."
  }
}
```

### 6. 开始挖矿

**请求**：

```
POST /mine
```

**请求体**：

```json
{
  "minerAddress": "cosmos1abc..."
}
```

**响应示例**：

```json
{
  "message": "挖矿已开始",
  "minerAddress": "cosmos1abc..."
}
```

### 7. 停止挖矿

**请求**：

```
POST /mine/stop
```

**响应示例**：

```json
{
  "message": "挖矿已停止"
}
```

### 8. 获取节点信息

**请求**：

```
GET /node/info
```

**响应示例**：

```json
{
  "httpPort": 3000,
  "p2pPort": 6001,
  "peers": ["QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N"],
  "minerAddress": "cosmos1abc...",
  "isMining": true
}
```

### 9. 添加对等节点

**请求**：

```
POST /node/peers
```

**请求体**：

```json
{
  "peer": "/ip4/192.168.1.100/tcp/6001/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N"
}
```

**响应示例**：

```json
{
  "message": "对等节点添加成功",
  "peer": "/ip4/192.168.1.100/tcp/6001/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N"
}
```

## 错误处理

所有 API 在发生错误时将返回适当的 HTTP 状态码和错误信息：

```json
{
  "error": "错误描述信息"
}
```

常见的错误状态码：

- `400`：请求参数错误
- `404`：请求的资源不存在
- `500`：服务器内部错误

## 使用示例

### 使用 curl 发送交易

```bash
curl -X POST http://localhost:3000/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "fromAddress": "cosmos1abc...",
    "toAddress": "cosmos1def...",
    "amount": 10,
    "privateKey": "abcdef123456..."
  }'
```

### 使用 curl 查询余额

```bash
curl http://localhost:3000/balance/cosmos1abc...
```

### 使用 curl 开始挖矿

```bash
curl -X POST http://localhost:3000/mine \
  -H "Content-Type: application/json" \
  -d '{
    "minerAddress": "cosmos1abc..."
  }'
```
