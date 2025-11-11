# Link Space Chat - 即时聊天工具

轻量级、可自托管的聊天室。支持局域网/公网访问（可选 ngrok），无需注册即可通过链接加入房间。

最后更新：2025-11

---

## 快速开始

依赖：Node.js 16+（推荐 18+）

安装依赖：
```bash
npm install
```

启动：
```bash
# 默认端口 3000
node server.js

# 指定端口
node server.js 4000

# 开启 ngrok（需设置 NGROK_AUTHTOKEN）
node server.js ngrok
# 或指定端口
node server.js ngrok 4000
```

访问：
- 本地：`http://localhost:<端口>`
- 局域网：`http://<你的局域网IP>:<端口>`
- 公网（启用 ngrok 后）：控制台输出的 https 地址

---

## 配置

- 端口优先级：命令行参数 > 环境变量 `LINK_SPACE_PORT` > 默认 3000
- 环境变量：
  - `MESSAGE_RETENTION_DAYS`：消息保留天数（默认 1）
  - `ENABLE_REQUEST_LOG`：是否输出请求日志（默认关闭）
  - `NGROK_AUTHTOKEN`：ngrok 令牌（启用 ngrok 时必需）

---

## 功能

- 房间：名称、描述、密码（“1” 号默认房间不可设置密码）
- 聊天：文本与 Emoji，消息历史与在线用户列表
- 频率限制：3 秒最多 5 条/用户
- 健康检查：`/health` 返回内存、连接、DB 统计、慢请求等
- 性能优化：SQLite WAL、联合索引、自动清理历史

近期安全与一致性优化（2025-11）
- 默认以纯文本渲染聊天消息，杜绝 XSS 注入
- 启动前等待数据库初始化与迁移完成，避免写入竞态
- 修正昵称占用检测探活逻辑，避免误踢在线用户

注意：房间密码依据需求为明文设计（按产品要求保留），请仅在可信环境使用。

---

## 验收自测

- 基本聊天：在两个浏览器页面打开 `http://localhost:3000/r/test`，输入昵称聊天
- 历史加载：刷新页面应加载最近 20 条
- 频率限制：快速发送超过 5 条/3 秒，出现提示
- 健康检查：访问 `http://localhost:3000/health`

---

## 技术栈

- 后端：Node.js、Express、Socket.IO、SQLite
- 前端：HTML、CSS、JavaScript
- 可选：ngrok 公网暴露、PM2 进程管理

团队：Do It Dui Team

