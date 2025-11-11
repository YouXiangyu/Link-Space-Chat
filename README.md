# Link Space Chat - 即时聊天工具

本工具是一个轻量级的即时消息平台，专为跨网络环境（局域网/公共互联网）设计。它允许用户通过链接快速加入聊天室，无需注册或安装客户端。

**项目还在不断完善, 暂时没有完善mvp功能**

**更新时间**: 2025年1月（添加了ngrok配置支持和消息频率限制功能）
---

## 目录
- [项目运行与测试指南](#项目运行与测试指南)
  - [一、环境准备](#一环境准备)
  - [二、本地部署](#二本地部署)
  - [三、启动服务](#三启动服务)
  - [四、端口配置](#四端口配置)
  - [五、数据库说明](#五数据库说明)
  - [六、开启公网访问 (可选)](#六开启公网访问-可选)
  - [七、消息频率限制](#七消息频率限制)
  - [八、功能测试](#八功能测试)
- [项目背景与设计](#项目背景与设计)
  - [项目简介](#项目简介)
  - [团队成员](#团队成员)
  - [技术栈](#技术栈)

---

## 项目运行与测试指南

本项目基于 Socket.IO 聊天示例改造，原始项目参考：[socketio/chat-example](https://github.com/socketio/chat-example)。

### 一、环境准备

- **Node.js**: 版本需 `16+`，推荐 `18+`。
- **操作系统**: 主要在 Windows 环境下开发，项目内包含 `.bat` 启动脚本。

### 二、本地部署

1.  **克隆仓库**
    ```bash
    git clone https://github.com/your-username/my-chat.git
    cd my-chat
    ```

2.  **安装依赖**
    在国内环境，建议使用 `cnpm` 或配置 `npm` 淘宝镜像源以加快速度。
    ```powershell
    # 使用 npm
    npm install

    # 或使用 cnpm
    # cnpm install
    ```

### 三、启动服务

启动后，服务将同时监听本地和局域网 IP，默认端口为 `3000`。关于如何修改端口和启用ngrok，请参考后续章节的说明。

#### 启动方式

1. **使用批处理文件 (Windows推荐)**
   ```cmd
   # 默认端口3000
   start-chat.bat
   
   # 指定端口
   start-chat.bat 4000
   
   # 启用ngrok（需要设置NGROK_AUTHTOKEN环境变量）
   start-chat.bat ngrok
   
   # 启用ngrok并指定端口
   start-chat.bat ngrok 4000
   ```

2. **使用PM2 (推荐用于生产环境)**
   ```bash
   # 默认端口3000
   pm2 start server.js
   
   # 指定端口
   pm2 start server.js -- 3001
   
   # 启用ngrok
   pm2 start server.js -- ngrok
   
   # 启用ngrok并指定端口
   pm2 start server.js -- ngrok 4000
   ```

3. **使用npm脚本**
   ```powershell
   npm run start
   ```

4. **直接使用node**
   ```bash
   # 默认端口
   node server.js
   
   # 指定端口
   node server.js 3001
   
   # 启用ngrok
   node server.js ngrok
   
   # 启用ngrok并指定端口
   node server.js ngrok 4000
   ```

控制台将输出以下信息 (以端口3000为例)：
- **本地访问**: `http://localhost:3000`
- **局域网访问**: `http://<你的局域网IP>:3000`
- **公网访问** (如果启用了ngrok): `https://xxxxx.ngrok.io`

### 四、端口配置

本项目的端口可以通过多种方式进行配置，生效优先级从高到低如下：

1.  **命令行参数 (最高)**
    在启动时，将端口号作为参数传入。这是最快捷的临时修改方式。
    ```cmd
    # 使用批处理文件
    start-chat.bat 4000
    
    # 使用node直接启动
    node server.js 4000
    
    # 使用PM2
    pm2 start server.js -- 4000
    ```

2.  **环境变量**
    设置名为 `LINK_SPACE_PORT` 的环境变量。此方式适合较为固定的配置。
    - **Windows (CMD)**:
      ```cmd
      set LINK_SPACE_PORT=4000
      npm run start
      ```
    - **Windows (PowerShell)**:
      ```powershell
      $env:LINK_SPACE_PORT = "4000"
      npm run start
      ```

3.  **默认值 (最低)**
    如果以上两种方式都未设置，则使用默认端口 `3000`。

### 五、数据库说明

- **数据库文件**: 项目使用 SQLite 数据库存储聊天记录，文件名为 `chat.db`。
- **自动创建**: 您**无需**手动创建数据库。首次启动服务时，`sqlite.js` 脚本会自动检测并创建 `chat.db` 文件及所需的数据表（`rooms` 和 `messages`）。
- **文件忽略**: `chat.db` 文件包含了所有的聊天历史记录。为了避免将个人或测试的聊天数据提交到版本控制系统（如 Git），`.gitignore` 文件已配置为忽略 `chat.db`。这确保了仓库的干净，同时保护了本地数据的私密性。

### 六、开启公网访问 (可选)

本项目集成了 `ngrok`，可以将本地服务暴露到公网，方便外网用户访问。

#### 1. 获取 ngrok Authtoken

- 前往 [ngrok 官网](https://ngrok.com/) 注册并登录。
- 在 [Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) 页面找到你的专属令牌 (Token)。

#### 2. 配置并启动

设置环境变量 `NGROK_AUTHTOKEN`，然后在启动时添加 `ngrok` 参数：

- **Windows (CMD)**:
  ```cmd
  set NGROK_AUTHTOKEN=这里替换成你的Token
  start-chat.bat ngrok
  ```

- **Windows (PowerShell)**:
  ```powershell
  $env:NGROK_AUTHTOKEN = "这里替换成你的Token"
  start-chat.bat ngrok
  ```

- **使用PM2**:
  ```bash
  export NGROK_AUTHTOKEN=你的Token  # Linux/Mac
  set NGROK_AUTHTOKEN=你的Token      # Windows CMD
  pm2 start server.js -- ngrok
  ```

启动成功后，控制台会额外输出一个公网 URL，形如 `https://xxxxx.ngrok.io`。其他用户可通过此地址访问你的聊天室。

> **注意**: 如果未设置 `NGROK_AUTHTOKEN` 环境变量，服务仍会正常启动，但ngrok功能将无法使用，控制台会显示警告信息。

### 七、消息频率限制

为了防止消息刷屏和滥用，系统实现了消息频率限制功能：

- **限制规则**: 每 3 秒最多发送 5 条消息
- **超过限制**: 当用户发送消息过于频繁时，消息将不会被发送，前端会显示一个浮动的提示信息（橙色提示框，3秒后自动消失）
- **提示位置**: 提示信息会显示在输入框上方，不会遮挡主要界面

### 八、功能测试

- **健康检查**: 访问 `http://localhost:3000/health`，应返回 `{ "ok": true }`。
- **基本聊天**: 在不同浏览器标签页打开 `http://localhost:3000/r/test`，输入昵称后即可开始聊天。
- **历史记录**: 刷新页面，应能自动加载最近的 20 条消息。
- **在线列表**: 侧边栏应实时显示当前房间的在线用户。
- **消息频率限制**: 快速连续发送多条消息（超过5条/3秒），应看到频率限制提示。

---

## 项目背景与设计

### 项目简介

随着移动互联网和即时消息（IM）工具的普及，人们对“即时、便捷、私密”的通信需求持续增长。本项目旨在将一个基于 Socket.IO 的最小聊天原型，发展成一个支持跨网络环境（局域网/公共互联网）的轻量级、可自托管的即时消息平台。

其核心模式是：
1.  **任何人都可以成为服务器**：用户可以一键在本地启动一个临时聊天室。
2.  **跨网络支持**：房间可通过局域网链接访问，并可选择通过NAT穿透暴露于公共互联网。
3.  **零摩擦加入**：其他用户无需注册或安装应用程序；他们可以通过链接直接在浏览器中加入。

### 团队成员

- **组长**: 游翔宇 (1230006152)
- **组员**: 孙宇轩 (1230019445)
- **组员**: 邢天舒 (1230002381)

### 技术栈

- **后端**: Node.js + Express.js
- **实时通信**: Socket.IO
- **数据库**: SQLite
- **公网暴露**: ngrok
- **进程管理**: PM2 (可选)
- **前端**: HTML, CSS, JavaScript
- **安全特性**: 消息频率限制、昵称唯一性检查