# Link Space Chat - 即时聊天工具

本工具是一个轻量级的即时消息平台，专为跨网络环境（局域网/公共互联网）设计。它允许用户通过链接快速加入聊天室，无需注册或安装客户端。

**更新时间**: 2025年11月12日（Phase 3 消息交互功能已完成）
---

## 目录
- [项目运行与测试指南](#项目运行与测试指南)
  - [一、环境准备](#一环境准备)
  - [二、本地部署](#二本地部署)
  - [三、启动服务](#三启动服务)
  - [四、开启公网访问 (可选)](#四开启公网访问-可选)
- [项目背景与设计](#项目背景与设计)
  - [项目简介](#项目简介)
  - [团队成员](#团队成员)
  - [技术栈](#技术栈)
- [项目实现原理](#项目实现原理)
- [阶段性目标](#阶段性目标)

---

## 项目运行与测试指南

本项目基于 Socket.IO 聊天示例改造，原始项目参考：[socketio/chat-example](https://github.com/socketio/chat-example)。
本项目已部署服务器，可以通过https://chat.youxiangyu.site 快速体验客户端效果。服务端部署同款软件，请参考下文。

### 一、环境准备

- **Node.js**: 版本需 `16+`，推荐 `18+`。
- **操作系统**: 主要在 Windows 环境下开发，项目内包含 `.bat` 启动脚本。

### 二、本地部署

1.  **克隆仓库**
    ```bash
    git clone https://github.com/YouXiangyu/Link-Space-Chat.git
    cd Link-Space-Chat
    ```

2.  **安装依赖**
    ```powershell
    # 使用 npm
    npm install

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

2. **使用PM2 (推荐用于生产环境，如服务器)**
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

3. **直接使用node**
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

### 四、开启公网访问 (可选)

本项目集成了 `ngrok`，可以将本地服务暴露到公网，方便外网用户访问。

#### 1. 获取 ngrok Authtoken

- 前往 [ngrok 官网](https://ngrok.com/) 注册并登录。
- 在 [Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) 页面找到你的专属令牌 (Token)。

#### 2. 配置并启动

设置环境变量 `NGROK_AUTHTOKEN`，然后在启动时添加 `ngrok` 参数：

- **通过Windows (CMD)**:
  ```cmd
  set NGROK_AUTHTOKEN=[这里替换成你的Token]
  start-chat.bat ngrok
  ```

- **通过Windows (PowerShell)**:
  ```powershell
  $env:NGROK_AUTHTOKEN = "这里替换成你的Token"
  start-chat.bat ngrok
  ```

- **通过使用PM2**:
  ```bash
  export NGROK_AUTHTOKEN=你的Token  # Linux/Mac
  set NGROK_AUTHTOKEN=你的Token      # Windows CMD
  pm2 start server.js -- ngrok
  ```

启动成功后，控制台会额外输出一个公网 URL，形如 `https://xxxxx.ngrok.io`。其他用户可通过此地址访问你的聊天室。

> **注意**: 如果未设置 `NGROK_AUTHTOKEN` 环境变量，服务仍会正常启动，但ngrok功能将无法使用，控制台会显示警告信息。

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

---

## 项目实现原理

本项目采用前后端分离的架构，使用 Socket.IO 实现实时通信。下面详细介绍项目的代码结构和实现原理。

### 项目目录结构

```
my-chat/
├── server.js              # 服务器主入口文件
├── config/                # 配置管理
│   └── index.js          # 集中管理所有配置项（端口、消息保留天数等）
├── db/                    # 数据库模块
│   ├── index.js          # 数据库主入口，初始化数据库连接
│   ├── migrations.js     # 数据库迁移脚本（添加新字段、创建索引等）
│   ├── rooms.js          # 房间相关的数据库操作（创建、查询、更新房间）
│   ├── messages.js       # 消息相关的数据库操作（保存、查询、清理消息）
│   └── stats.js          # 数据库统计信息（数据库大小、消息数量等）
├── socket/                # Socket.IO 事件处理
│   ├── index.js          # Socket 事件处理器注册中心
│   └── handlers/         # 各个 Socket 事件的具体处理逻辑
│       ├── joinRoom.js   # 处理用户加入房间的事件
│       ├── leaveRoom.js  # 处理用户离开房间的事件
│       ├── chatMessage.js # 处理用户发送消息的事件
│       ├── getRoomInfo.js # 处理获取房间信息的事件
│       └── updateRoom.js  # 处理更新房间信息的事件（如修改房间名称、密码）
├── services/              # 业务逻辑服务层
│   ├── roomState.js      # 房间状态管理（内存中维护在线用户列表）
│   ├── rateLimiter.js    # 消息频率限制服务（防止刷屏）
│   ├── messageService.js # 消息处理服务（检测消息类型、高亮等）
│   └── healthReporter.js # 健康检查报告生成服务
├── middlewares/          # Express 中间件
│   ├── requestLogger.js  # 请求日志记录中间件（可选）
│   └── slowRequestTracker.js # 慢请求追踪中间件
├── utils/                # 工具函数
│   └── errors.js         # 统一错误处理格式
├── public/               # 前端静态资源
│   ├── index.html        # 前端页面
│   ├── app.js            # 前端主逻辑（整合各个模块）
│   ├── cyberStyles.css   # 赛博风格样式
│   ├── lightStyles.css   # 浅色主题样式
│   └── js/               # 前端模块化代码
│       ├── modules/      # 功能模块
│       │   ├── socketManager.js    # Socket 连接管理
│       │   ├── roomController.js   # 房间操作控制
│       │   ├── messageController.js # 消息发送控制
│       │   └── searchController.js  # 消息搜索控制
│       ├── core/         # 核心功能
│       │   ├── appState.js          # 应用状态管理
│       │   └── eventBus.js          # 事件总线
│       └── utils/        # 前端工具函数
└── docs/                 # 文档和归档
    └── legacy-css/       # 历史样式文件归档
```

### 核心模块说明

#### 1. 数据库模块 (`db/`)

- **`db/index.js`**: 数据库初始化入口
  - 创建 SQLite 数据库连接
  - 配置数据库性能参数（WAL 模式、缓存大小等）
  - 初始化数据表结构（`rooms` 表和 `messages` 表）
  - 导出统一的数据库操作接口

- **`db/migrations.js`**: 数据库迁移脚本
  - 当项目升级时，自动为新字段创建数据库列
  - 确保数据库结构与代码版本一致
  - 支持向后兼容（不会删除已有数据）

- **`db/rooms.js`**: 房间数据操作
  - `ensureRoom()`: 确保房间存在，不存在则创建
  - `getRoom()`: 查询房间信息（名称、描述、密码等）
  - `updateRoom()`: 更新房间信息（修改名称、描述、密码等）

- **`db/messages.js`**: 消息数据操作
  - `saveMessage()`: 保存新消息到数据库
  - `getRecentMessages()`: 获取最近的消息（用于加载历史记录）
  - `cleanOldMessages()`: 清理超过保留天数的旧消息
  - `clearHistoryForRoom()`: 清空某个房间的所有消息

#### 2. Socket.IO 事件处理 (`socket/`)

- **`socket/index.js`**: Socket 事件注册中心
  - 监听客户端连接事件
  - 为每个连接注册事件处理器
  - 处理客户端断开连接时的清理工作

- **`socket/handlers/joinRoom.js`**: 处理加入房间
  - 验证房间密码（如果有）
  - 将用户添加到房间的在线用户列表
  - 加载房间的历史消息
  - 通知房间内其他用户有新用户加入

- **`socket/handlers/chatMessage.js`**: 处理发送消息
  - 检查消息频率限制（防止刷屏）
  - 检测消息类型（文本、Emoji、高亮等）
  - 保存消息到数据库
  - 广播消息给房间内所有用户

- **`socket/handlers/updateRoom.js`**: 处理更新房间
  - 验证用户是否有权限（是否为创建者）
  - 更新房间信息（名称、描述、密码）
  - 如果修改了密码，清空聊天记录
  - 通知房间内所有用户房间信息已更新

#### 3. 服务层 (`services/`)

- **`services/roomState.js`**: 房间状态管理（内存中）
  - 维护每个房间的在线用户列表（使用 Map 数据结构）
  - 用户加入/离开时更新列表
  - 提供获取房间用户列表的接口

- **`services/rateLimiter.js`**: 消息频率限制
  - 记录每个用户最近发送消息的时间
  - 检查是否超过限制（默认：3秒内最多5条）
  - 超过限制时拒绝发送并返回错误

- **`services/messageService.js`**: 消息处理服务
  - 自动检测消息类型（Emoji、高亮文本等）
  - 处理消息的格式化

#### 4. 中间件 (`middlewares/`)

- **`middlewares/requestLogger.js`**: 请求日志记录
  - 记录每个 HTTP 请求的详细信息（可选，通过环境变量控制）
  - 用于调试和监控

- **`middlewares/slowRequestTracker.js`**: 慢请求追踪
  - 记录处理时间超过1秒的请求
  - 用于性能分析和优化

#### 5. 前端代码 (`public/`)

- **`public/app.js`**: 前端主逻辑
  - 初始化 Socket 连接
  - 整合各个功能模块
  - 处理用户界面交互

- **`public/js/modules/socketManager.js`**: Socket 连接管理
  - 建立和维护与服务器的 Socket 连接
  - 处理连接、断开、错误等事件
  - 提供发送消息、加入房间等接口

- **`public/js/modules/roomController.js`**: 房间操作控制
  - 处理加入房间、离开房间的逻辑
  - 处理房间密码验证
  - 更新房间信息显示

- **`public/js/modules/messageController.js`**: 消息发送控制
  - 处理消息输入和发送
  - 处理消息回复功能
  - 显示消息发送状态

### 工作流程示例

#### 用户加入房间的流程：

1. **前端**: 用户在浏览器输入房间ID和昵称，点击"加入"
2. **前端**: `roomController.js` 调用 `socketManager.joinRoom()`
3. **网络**: Socket.IO 发送 `join_room` 事件到服务器
4. **后端**: `socket/handlers/joinRoom.js` 接收事件
5. **后端**: 检查房间是否存在，不存在则创建（调用 `db.ensureRoom()`）
6. **后端**: 如果房间有密码，验证密码是否正确
7. **后端**: 将用户添加到房间的在线用户列表（`roomState.addUser()`）
8. **后端**: 从数据库加载最近20条消息（`db.getRecentMessages()`）
9. **后端**: 通过 Socket 发送历史消息给用户（`history` 事件）
10. **后端**: 通知房间内其他用户有新用户加入（`room_users` 事件）
11. **前端**: 接收到历史消息，渲染到聊天界面
12. **前端**: 更新在线用户列表显示

#### 用户发送消息的流程：

1. **前端**: 用户在输入框输入消息，按 Enter 发送
2. **前端**: `messageController.js` 调用 `socketManager.sendMessage()`
3. **网络**: Socket.IO 发送 `chat_message` 事件到服务器
4. **后端**: `socket/handlers/chatMessage.js` 接收事件
5. **后端**: `rateLimiter.checkRateLimit()` 检查频率限制
6. **后端**: `messageService.detectMessageType()` 检测消息类型
7. **后端**: `db.saveMessage()` 保存消息到数据库
8. **后端**: 通过 Socket 广播消息给房间内所有用户（`chat_message` 事件）
9. **前端**: 所有用户接收到消息，渲染到聊天界面

### 数据存储

- **SQLite 数据库** (`chat.db`): 存储持久化数据
  - `rooms` 表: 存储房间信息（ID、名称、描述、密码、创建者等）
  - `messages` 表: 存储所有聊天消息（房间ID、昵称、内容、时间等）

- **内存数据结构**: 存储临时状态
  - 房间在线用户列表（`roomState`）
  - 消息频率限制记录（`rateLimiter`）

### 实时通信机制

项目使用 **Socket.IO** 实现实时双向通信：

- **WebSocket 连接**: 浏览器与服务器建立长连接
- **事件驱动**: 通过事件（如 `join_room`、`chat_message`）进行通信
- **自动重连**: Socket.IO 自动处理网络断开和重连
- **心跳检测**: 定期发送心跳包，检测连接是否存活

---

## 阶段性目标

本项目采用渐进式开发策略，在保持**零认证门槛**、**轻量化**和**高性能**的前提下，逐步增强功能。

### 已完成阶段

- ✅ **Phase 1**: 性能优化与稳定性提升（数据库优化、内存管理、监控与健康检查）
- ✅ **Phase 2**: 轻量级功能增强（房间管理、消息类型支持、用户体验优化）
- ✅ **Phase 3**: 消息交互功能（消息回复、消息高亮、局部搜索）

### 未来计划

- 📋 **Phase 4**: 文件传输功能（支持图片和文档上传）
- 📋 **Phase 5**: 投票功能（轻量级投票系统）
- 📋 **Phase 6**: 高级优化与扩展（缓存机制、消息分页、性能监控）

---

### Phase 2: 轻量级功能增强 🎨 ✅（已完成）

**目标**: 添加基础但实用的功能，保持轻量化

**预计时间**: 2-3周

**性能影响**: ➡️ 轻微增加（<5%）

**完成时间**: 2025年11月

#### Todo 清单

- [x] **房间功能增强** ✅
  - [x] 为 `rooms` 表添加 `name` 字段（房间名称，可选）
  - [x] 为 `rooms` 表添加 `description` 字段（房间描述，可选）
  - [x] 为 `rooms` 表添加 `password` 字段（房间密码，NULL表示开放房间）
  - [x] 为 `rooms` 表添加 `creator_session` 字段（创建者session_id，用于权限判断）
  - [x] 实现数据库迁移脚本（向后兼容，使用ALTER TABLE ADD COLUMN IF NOT EXISTS）
  - [x] 前端支持显示和编辑房间名称（侧边栏添加编辑按钮）
  - [x] 前端支持设置房间密码（创建者功能，密码长度限制4-20字符）
  - [x] 前端支持加入密码房间（输入密码界面，密码错误提示）
  - [x] 实现密码验证逻辑（join_room时验证，密码错误返回明确错误信息）
  - [x] 实现修改密码功能（创建者可修改，修改时清空聊天记录并通知所有用户）
  - [x] 实现取消密码功能（创建者可以移除密码，变为开放房间）
  - [x] 限制默认房间（"1"）不能设置密码（前端和后端双重验证）
  - [x] 添加房间信息显示（显示房间是否有密码、创建者信息等）

- [x] **消息类型支持** ✅
  - [x] 为 `messages` 表添加 `content_type` 字段（text/emoji/file等，默认'text'）
- [x] 实现消息类型自动检测逻辑（检测高亮文本（Emoji）、URL等）
- [x] 支持高亮文本消息（当前通过 Unicode Emoji 检测，如 😀 🎉 ✅ 等）
  - [x] 前端渲染不同类型的消息（不同消息类型使用不同样式）

- [x] **用户体验优化** ✅
  - [x] 消息时间显示优化（相对时间：刚刚、1分钟前等）
  - [x] 添加消息发送状态指示（发送中、已发送）
  - [x] 优化移动端响应式布局
  - [x] 添加键盘快捷键（Enter发送，Shift+Enter换行）
  - [x] 界面美化：优化CSS样式，提升视觉效果（渐变背景、动画效果、自定义滚动条等）

**数据库变更**:
```sql
ALTER TABLE rooms ADD COLUMN name TEXT;
ALTER TABLE rooms ADD COLUMN description TEXT;
ALTER TABLE rooms ADD COLUMN password TEXT;  -- NULL表示开放房间，有值表示需要密码
ALTER TABLE rooms ADD COLUMN creator_session TEXT;  -- 创建者的session_id（用于判断修改权限）
ALTER TABLE messages ADD COLUMN content_type TEXT DEFAULT 'text';
```

**房间密码功能设计**:
- **零认证原则**: 使用 `creator_session`（Socket.IO session ID）而非用户ID，无需用户表
- **密码机制**: 
  - `password` 为 NULL = 开放房间（无需密码）
  - `password` 有值 = 需要密码才能加入
  - 默认房间（ID为"1"）强制开放，不能设置密码
- **创建者权限**: 
  - 第一个加入房间的人自动成为创建者（记录 `creator_session`）
  - 创建者可以设置/修改密码
  - 修改密码时，清空所有聊天记录（刷新房间机制）
- **性能影响**: 极小（仅增加一次字符串比较）

**验收标准**:
- ✅ 房间可以设置名称和描述
- ✅ 房间可以设置密码（创建者功能）
- ✅ 加入密码房间需要输入正确密码
- ✅ 默认房间（"1"）不能设置密码
- ✅ 修改密码会清空聊天记录（刷新房间）
- ✅ 支持发送和显示高亮文本（Emoji）
- ✅ 移动端体验流畅
- ✅ 界面美观，用户体验良好

**新增功能说明**:
1. **房间管理**：创建者可以设置房间名称、描述和密码，其他用户加入密码房间时需要输入密码
2. **消息类型**：自动检测高亮文本（Emoji）并应用特殊样式显示
3. **时间显示**：使用相对时间（刚刚、1分钟前等）提升可读性
4. **发送状态**：显示消息发送状态，提升用户反馈
5. **键盘快捷键**：Enter发送消息，Shift+Enter换行
6. **界面优化**：美化界面样式，添加动画效果和自定义滚动条

---

### Phase 3: 消息交互功能 💬（已完成）

**目标**: 增强消息交互能力，提升用户体验  
**本节更新时间**: 2025年11月12日  
**完成时间**: 2025年11月12日

**预计时间**: 2-3周

**性能影响**: ➡️ 轻微增加（<8%）

#### Todo 清单

- [x] **消息回复功能**
  - [x] 为 `messages` 表添加 `parent_message_id` 字段（支持引用回复，可为 NULL）
  - [x] 创建 `idx_messages_parent` 索引，提升父消息查找性能
  - [x] Socket 事件支持 `{ parentMessageId }`，后端存储并广播引用信息
  - [x] PC 点击消息、移动端长按消息，弹出引用输入框并支持点击外部/按钮取消
  - [x] 前端渲染引用块（展示昵称 + 摘要），最多展示两层引用关系

- [x] **消息高亮功能**
  - [x] 为 `messages` 表添加 `is_highlighted` 字段（0/1）
  - [x] 前端在发送前检测 `# 标题` 风格文本并标记高亮
  - [x] 后端保存并回传高亮状态，前端复用现有亮色样式展示

- [x] **局部搜索（仅前端）**
  - [x] 侧边栏新增搜索输入框（带放大镜图标）
  - [x] 在浏览器端遍历当前已加载的消息列表并执行文本匹配
  - [x] 命中后滚动定位消息并临时高亮约 1 秒
  - [x] 未命中时提示“未找到”，不额外拉取历史记录

**数据库变更**:
```sql
ALTER TABLE messages ADD COLUMN parent_message_id INTEGER;
ALTER TABLE messages ADD COLUMN is_highlighted INTEGER DEFAULT 0;
CREATE INDEX idx_messages_parent ON messages(parent_message_id);
```

**验收标准**:
- ✅ PC 点击 / 移动端长按可触发回复输入框，并支持取消
- ✅ 回复消息展示引用信息，引用层级不超过两层
- ✅ 输入 `#` 开头的标题消息自动高亮
- ✅ 侧边栏搜索可定位当前已加载的消息并临时高亮
- ✅ 房间被清空后，引用和高亮状态同步清除

---

### Phase 4: 文件传输功能 📁

**目标**: 支持轻量级文件传输（小文件，避免服务器压力）

**预计时间**: 3-4周

**性能影响**: ⬆️ 中等增加（10-15%，取决于使用频率）

#### Todo 清单

- [ ] **文件上传基础**
  - [ ] 添加文件上传中间件（限制文件大小，默认5MB，可通过配置调整）
  - [ ] 实现文件存储逻辑（本地存储到 `public/uploads/` 目录，按日期分文件夹）
  - [ ] 为 `messages` 表扩展 `content` 字段支持 JSON 格式存储文件信息（向后兼容，现有text消息不受影响）
  - [ ] 实现文件上传的API端点（POST /api/upload）
  - [ ] 添加文件类型白名单（图片：jpg, png, gif, webp；文档：pdf, doc, docx, txt）
  - [ ] 实现文件上传的安全验证（文件名清理，防止路径遍历攻击）

- [ ] **文件类型支持**
  - [ ] 支持图片预览（jpg, png, gif, webp）
  - [ ] 支持文档类型（pdf, doc等，仅显示下载链接）
  - [ ] 文件大小和类型验证

- [ ] **性能优化**
  - [ ] 实现文件上传进度显示
  - [ ] 添加文件自动清理机制（30天后删除未使用的文件）
  - [ ] 图片压缩和缩略图生成（可选）

**数据库变更**:
```sql
-- content 字段改为 TEXT，存储 JSON
-- 示例: {"type": "file", "filename": "xxx.jpg", "url": "/files/xxx.jpg", "size": 12345}
```

**验收标准**:
- 可以上传和分享图片（自动预览）
- 可以上传其他类型文件（显示下载链接）
- 文件大小限制有效
- 不影响聊天性能

---

### Phase 5: 投票功能 🗳️

**目标**: 实现轻量级投票功能（无需用户认证）

**预计时间**: 2-3周

**性能影响**: ➡️ 轻微增加（<5%）

#### Todo 清单

- [ ] **投票数据模型**
  - [ ] 创建 `polls` 表（关联消息）
  - [ ] 创建 `poll_options` 表（投票选项）
  - [ ] 创建 `votes` 表（投票记录，使用 session_id 而非 user_id）

- [ ] **投票功能实现**
  - [ ] 前端投票创建界面（选项数量限制2-10个，选项文本长度限制100字符）
  - [ ] 投票消息渲染（显示选项和实时结果，显示投票人数）
  - [ ] 投票逻辑（一人一票，基于 session，防止重复投票）
  - [ ] 投票结果实时更新（使用Socket.IO实时推送投票结果）
  - [ ] 添加投票截止时间功能（可选，创建投票时可设置截止时间）
  - [ ] 实现投票结果可视化（进度条显示各选项得票率）

- [ ] **性能优化**
  - [ ] 投票结果缓存（避免频繁查询）
  - [ ] 优化投票查询 SQL

**数据库变更**:
```sql
CREATE TABLE polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    FOREIGN KEY(message_id) REFERENCES messages(id)
);

CREATE TABLE poll_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    FOREIGN KEY(poll_id) REFERENCES polls(id)
);

CREATE TABLE votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    option_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,  -- 使用 session 而非 user_id
    created_at INTEGER NOT NULL,
    FOREIGN KEY(option_id) REFERENCES poll_options(id),
    UNIQUE(option_id, session_id)  -- 防止重复投票
);
```

**验收标准**:
- 可以创建投票消息
- 可以参与投票（一人一票）
- 投票结果实时显示
- 性能影响可接受

---

### Phase 6: 高级优化与扩展 🚀

**目标**: 性能优化、缓存机制、高级功能

**预计时间**: 3-4周

**性能影响**: ⬇️ 降低资源占用

#### Todo 清单

- [ ] **缓存机制**
  - [ ] 实现消息历史缓存（Redis 或内存缓存，可选）
  - [ ] 房间列表缓存
  - [ ] 在线用户列表缓存优化

- [ ] **消息分页优化**
  - [ ] 实现真正的消息分页（而非仅加载最近20条）
  - [ ] 前端支持滚动加载更多历史消息
  - [ ] 优化大量历史消息的渲染性能

- [ ] **性能监控**
  - [ ] 添加性能指标收集（响应时间、内存使用等）
  - [ ] 实现慢查询日志
  - [ ] 添加资源使用告警

- [ ] **高级功能（可选）**
  - [ ] 消息编辑和删除（仅发送者，有时间限制）
  - [ ] 房间密码保护（可选）
  - [ ] 消息导出功能

**验收标准**:
- 缓存机制有效降低数据库压力
- 支持加载更多历史消息
- 性能监控正常工作
- 整体性能提升 20% 以上