# Do It Dui Chat - 即时聊天工具

本工具是一个轻量级的即时消息平台，专为跨网络环境（局域网/公共互联网）设计。它允许用户通过链接快速加入聊天室，无需注册或安装客户端。

**项目还在不断完善, 暂时没有完善mvp功能**

---

## 目录
- [项目运行与测试指南](#项目运行与测试指南)
  - [一、环境准备](#一环境准备)
  - [二、本地部署](#二本地部署)
  - [三、启动服务](#三启动服务)
  - [四、开启公网访问 (可选)](#四开启公网访问-可选)
  - [五、功能测试](#五功能测试)
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

启动后，服务将同时监听本地和局域网 IP。

- **方式 A (推荐)**: 直接双击根目录下的 `start-chat.bat` 文件。
- **方式 B (命令行)**:
  ```powershell
  npm run start
  ```

控制台将输出以下信息，表示启动成功：
- **本地访问**: `http://localhost:3000`
- **局域网访问**: `http://<你的局域网IP>:3000`
- **房间链接格式**: `http://<你的局域网IP>:3000/r/<room-id>` (其中 `<room-id>` 为自定义的房间名)

### 四、开启公网访问 (可选)

本项目集成了 `ngrok`，可以将本地服务暴露到公网，方便外网用户访问。

1.  **获取 ngrok Authtoken**
    - 前往 [ngrok 官网](https://ngrok.com/) 注册并登录。
    - 在 [Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) 页面找到你的专属令牌 (Token)。

2.  **配置并启动**
    在启动服务时，将获取到的 `Authtoken` 作为环境变量传入。

    - **Windows (PowerShell)**:
      ```powershell
      $env:NGROK_AUTHTOKEN = "这里替换成你的Token"
      npm run start
      ```

    - **Windows (CMD)**:
      ```cmd
      set NGROK_AUTHTOKEN=这里替换成你的Token
      npm run start
      ```

    - **通过 `start-chat.bat` 传参**:
      `start-chat.bat` 支持传入端口和 Token 作为参数。
      ```cmd
      # 格式: start-chat.bat [端口号] [ngrok_token]
      start-chat.bat 3001 "这里替换成你的Token"
      ```

    启动成功后，控制台会额外输出一个公网 URL，形如 `https://xxxxx.ngrok.io`。其他用户可通过此地址访问你的聊天室。

### 五、功能测试

- **健康检查**: 访问 `http://localhost:3000/health`，应返回 `{ "ok": true }`。
- **基本聊天**: 在不同浏览器标签页打开 `http://localhost:3000/r/test`，输入昵称后即可开始聊天。
- **历史记录**: 刷新页面，应能自动加载最近的 20 条消息。
- **在线列表**: 侧边栏应实时显示当前房间的在线用户。

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
- **前端**: HTML, CSS, JavaScript
