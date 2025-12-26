# Demo演示详细规划（邢天舒负责）

## 一、演示目标

通过实际代码和运行效果，展示：
1. 核心功能的代码实现细节（加入房间的流程，100行以上代码）
2. 系统的实际运行效果（MVP功能演示）

## 二、演示时间分配

- **总时长**: 3-4分钟
- **代码细节展示**: 1-1.5分钟（60-90秒）
- **实际运行演示**: 2分钟（120秒）

## 三、代码细节展示（1-1.5分钟，60-90秒）

### 4.1 核心对象：加入房间流程（Join Room）

**目标**: 展示项目复杂度和代码质量，展示一段连续的、逻辑复杂的代码（>100行）

**文件**: `socket/handlers/joinRoom.js`（168行代码）

**展示方式**: 在IDE或PPT中展示一段连续的、逻辑复杂的代码（>100行），简述其处理了参数校验、房间存在性检查、用户状态更新等逻辑。

#### 4.1.1 关键代码片段1：空房间重置逻辑（第47-60行，20秒）

```47:60:socket/handlers/joinRoom.js
      let room = await db.getRoom(roomId);
      if (room) {
        const userCount = usersMap ? usersMap.size : 0;
        // 如果房间存在但当前没有在线用户，且房间有密码或创建者信息，说明是服务器重启后的情况
        // 按照业务规则，空房间应该重置（清空消息、密码、创建者信息）
        if (userCount === 0 && (room.password || room.creatorSession)) {
          // 清空消息 + 清空密码与创建者
          if (typeof db.clearMessagesForRoom === 'function') {
            await db.clearMessagesForRoom(roomId);
          } else {
            await db.clearHistoryForRoom(roomId);
          }
          await db.updateRoom(roomId, { password: null, creatorSession: null });
          // 重新读取房间信息（已清空密码）
          room = await db.getRoom(roomId);
        }
```

**讲解要点**:
- 处理服务器重启后的空房间重置逻辑
- 检查在线用户数，判断是否需要重置
- 清空消息、密码和创建者信息

#### 4.1.2 关键代码片段2：昵称占用检查（第73-97行，25秒）

```73:97:socket/handlers/joinRoom.js
      let existingSocketId = roomState.findSocketIdByNickname(roomId, name);

      if (existingSocketId) {
        // 如果昵称已被占用，检查占用该昵称的用户是否还在线
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (!oldSocket) {
          // Socket 不存在（可能是异常断开），从房间状态中移除
          roomState.removeUserImmediate(existingSocketId, roomId, db);
        } else {
          // Socket 存在，发送 ping 消息检查是否真的在线
          const isAlive = await new Promise((resolve) => {
            oldSocket.timeout(2000).emit("server-ping", (err, pong) => {
              resolve(!err && pong === "ok");
            });
          });
          if (isAlive) {
            // 用户确实在线，拒绝使用该昵称
            return ack(createErrorResponse(ErrorCodes.NICKNAME_TAKEN, "该昵称已被占用"));
          } else {
            // 用户不在线（可能是僵尸连接），清理旧连接
            roomState.removeUserImmediate(oldSocket.id, roomId, db);
            oldSocket.disconnect(true);
          }
        }
      }
```

**讲解要点**:
- 检查昵称是否已被占用
- 处理异常断开的用户（僵尸连接）
- 使用ping机制验证连接真实状态

#### 4.1.3 关键代码片段3：历史消息加载（第121-141行，25秒）

```121:141:socket/handlers/joinRoom.js
      // 加载房间的历史消息（最近20条）
      let history = await messageService.getRecentMessages(db, roomId, 20);
      
      // 为每条消息加载投票数据（如果有）
      for (let i = 0; i < history.length; i++) {
        const message = history[i];
        const poll = await db.getPollByMessageId(message.id);
        if (poll) {
          // 获取用户已投的选项（如果有）
          const userVote = await db.getUserVote({
            pollId: poll.id,
            sessionId: socket.id
          });
          history[i] = {
            ...message,
            poll: {
              ...poll,
              userVote
            }
          };
        }
      }
```

**讲解要点**:
- 加载历史消息（最近20条）
- 为每条消息加载关联的投票数据
- 获取用户已投票状态

**总体讲解要点**:
- 展示代码复杂度和逻辑完整性
- 说明参数校验、房间存在性检查、用户状态更新等核心逻辑
- 强调代码质量（错误处理、边界情况处理）

## 五、实际运行演示（2分钟，120秒）

### 5.1 演示环境准备

#### 5.1.1 启动服务器
```bash
# 方式1: 使用批处理文件
start-chat.bat

# 方式2: 使用node
node server.js

# 方式3: 使用PM2
pm2 start server.js
```

#### 5.1.2 打开浏览器
- 主窗口：`http://localhost:3000`
- 备用窗口：`http://localhost:3000/r/test-room`（用于多用户演示）

### 5.2 演示场景1：加入房间（40秒）

#### 5.2.1 操作步骤
1. 生成并展示访问链接/二维码（确保局域网/公网可访问）
2. 打开浏览器，访问链接（或扫描二维码）
3. 输入房间ID：`test-room`
4. 输入昵称：`Demo User`
5. 点击"加入"按钮

#### 5.2.2 展示内容
- 分享公网链接/二维码，全班同学同时体验
- 界面加载
- 输入框交互
- 加入成功后的界面（消息列表、用户列表、输入框）

#### 5.2.3 讲解要点
> "现在我们来演示系统的实际运行效果。
> 
> 首先，我们生成并分享访问链接或二维码，让全班同学可以同时体验。用户在浏览器中输入房间ID和昵称，点击加入。系统会验证房间是否存在，如果不存在则自动创建。加入成功后，用户可以看到历史消息和在线用户列表。
> 
> 这个流程完全对应我们刚才看到的代码实现。"

### 5.3 演示场景2：发送消息（40秒）

#### 5.3.1 操作步骤
1. 在消息输入框中输入：`Hello, this is a test message`
2. 按Enter发送（演示文字发送）
3. 输入：`# 这是一条高亮消息`
4. 按Enter发送
5. 点击某条消息，输入回复：`This is a reply`
6. 按Enter发送
7. 多用户同时发送消息（展示多用户交互）

#### 5.3.2 展示内容
- 普通消息显示
- 高亮消息显示（特殊样式）
- 回复消息显示（引用块）
- 多用户同时发送消息的实时同步效果

#### 5.3.3 讲解要点
> "接下来演示消息发送功能。
> 
> 我们发送一条普通消息，可以看到消息立即显示在聊天界面中。然后发送一条以#开头的高亮消息，可以看到消息以特殊样式显示，这对应我们代码中的isHighlighted检测逻辑。
> 
> 最后，我们点击某条消息进行回复，可以看到回复消息显示了引用关系，这对应我们数据库中的parent_message_id字段。
> 
> 现在多个用户同时发送消息，可以看到消息实时同步的效果，展示了系统的实时通信能力。"

### 5.4 演示场景3：多用户交互（40秒）

#### 5.4.1 操作步骤
1. 多个用户（多个浏览器窗口/设备）同时加入同一个房间
2. 在第一个窗口发送消息
3. 观察其他窗口是否实时接收到消息
4. 观察在线用户列表的实时更新
5. 展示交互反馈：消息实时同步的效果

#### 5.4.2 展示内容
- 多窗口/多设备同时打开
- 实时消息同步（所有用户同时看到新消息）
- 在线用户列表实时更新
- 交互反馈：消息实时同步的效果

#### 5.4.3 讲解要点
> "最后，我们演示多用户实时交互。
> 
> 多个用户同时加入同一个房间。当第一个用户发送消息时，其他所有用户的窗口都会立即接收到消息，这展示了Socket.IO的实时通信能力。
> 
> 同时，在线用户列表也会实时更新，展示了RoomState服务的内存状态管理功能。
> 
> 这体现了我们系统的实时性和多用户支持能力，展示了MVP（Minimum Viable Product）的即时通讯功能。"

## 六、演示技巧与注意事项

### 6.1 代码展示技巧
1. **使用代码高亮**: 使用支持语法高亮的编辑器（VS Code）
2. **放大显示**: 使用编辑器的大字体或缩放功能
3. **重点标记**: 使用鼠标指针或高亮标记关键代码
4. **逐行讲解**: 不要一次性显示太多代码，逐行或逐块讲解

### 6.2 运行演示技巧
1. **提前准备**: 所有演示环境提前启动并测试
2. **备用方案**: 准备截图或录屏作为备用
3. **流畅操作**: 操作要流畅，避免卡顿
4. **清晰讲解**: 边操作边讲解，说明每一步的作用

### 6.3 时间控制
- **严格计时**: 使用计时器控制每部分时间
- **灵活调整**: 根据实际情况调整各部分时间
- **重点突出**: 如果时间不够，优先展示核心功能

### 6.4 常见问题应对
1. **服务器未启动**: 提前准备启动脚本，快速启动
2. **浏览器兼容性**: 使用Chrome浏览器，兼容性最好
3. **网络问题**: 使用localhost，避免网络延迟
4. **代码显示不清**: 使用大字体或截图放大

## 七、演示检查清单

### 7.1 环境准备
- [ ] 服务器已启动并正常运行
- [ ] 浏览器已打开并可以访问
- [ ] 代码文件已打开在编辑器中

### 7.2 代码准备
- [ ] `joinRoom.js` 已打开并定位到关键函数（100行以上代码）

### 7.3 演示准备
- [ ] 测试房间已创建（可选）
- [ ] 测试消息已发送（可选，用于展示历史消息）
- [ ] 多个浏览器窗口已准备好
- [ ] 演示脚本已熟悉

### 7.4 备用方案
- [ ] 关键界面已截图
- [ ] 关键代码已截图
- [ ] 录屏已准备好（可选）

---

**文档创建时间**: 2025年11月
**负责人**: 邢天舒

