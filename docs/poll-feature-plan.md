# 投票功能实现规划

**创建时间**: 2025-01-12  
**更新时间**: 2025-01-12  
**功能阶段**: Phase 5 - 投票功能

---

## 一、需求概述

实现轻量级投票功能，允许用户在聊天室中创建投票并参与投票。投票功能遵循项目的零认证原则，使用 `session_id` 而非 `user_id` 来防止重复投票。

### 核心特性
- ✅ 创建投票消息（2-10个选项，选项文本最多100字符）
- ✅ 参与投票（一人一票，基于 session_id）
- ✅ 实时显示投票结果（使用 Socket.IO 推送）
- ✅ 投票结果可视化（进度条显示得票率）
- ✅ 显示投票人数
- ⏳ 可选：投票截止时间功能

---

## 二、数据库设计

### 2.1 数据表结构

#### `polls` 表（投票主表）
```sql
CREATE TABLE polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    expires_at INTEGER,  -- 可选：投票截止时间（时间戳，NULL表示无截止时间）
    created_at INTEGER NOT NULL,
    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE
);
```

#### `poll_options` 表（投票选项表）
```sql
CREATE TABLE poll_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    option_index INTEGER NOT NULL,  -- 选项顺序（0, 1, 2...）
    created_at INTEGER NOT NULL,
    FOREIGN KEY(poll_id) REFERENCES polls(id) ON DELETE CASCADE
);
```

#### `votes` 表（投票记录表）
```sql
CREATE TABLE votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    option_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,  -- 使用 session_id 而非 user_id（零认证原则）
    created_at INTEGER NOT NULL,
    FOREIGN KEY(option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    UNIQUE(option_id, session_id)  -- 防止同一session对同一选项重复投票
);
```

### 2.2 索引设计

```sql
-- 提升查询性能的索引
CREATE INDEX idx_polls_message ON polls(message_id);
CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX idx_votes_option ON votes(option_id);
CREATE INDEX idx_votes_session ON votes(session_id);
```

### 2.3 数据库迁移

在 `db/migrations.js` 中添加投票相关表的创建逻辑，确保向后兼容。

---

## 三、后端实现规划

### 3.1 数据库模块 (`db/polls.js`)

创建新的数据库操作模块，提供以下功能：

#### 核心函数
- `createPoll(db, { messageId, options, expiresAt })` - 创建投票
  - 参数：messageId（消息ID）、options（选项数组）、expiresAt（可选截止时间）
  - 返回：投票对象（包含 pollId 和 optionIds）

- `getPollByMessageId(db, messageId)` - 根据消息ID获取投票信息
  - 返回：投票对象（包含选项列表和每个选项的得票数）

- `getPollResults(db, pollId)` - 获取投票结果
  - 返回：选项列表，每个选项包含得票数和得票率

- `castVote(db, { optionId, sessionId })` - 投票
  - 参数：optionId（选项ID）、sessionId（用户session ID）
  - 返回：成功/失败状态
  - 逻辑：检查是否已投票，如果已投票则更新投票（允许改投）

- `getUserVote(db, { pollId, sessionId })` - 获取用户已投的选项
  - 返回：用户已投的选项ID（如果有）

- `deletePollByMessageId(db, messageId)` - 删除投票（级联删除选项和投票记录）
  - 用于清理：当消息被删除时，自动删除关联的投票

### 3.2 Socket 事件处理器 (`socket/handlers/poll.js`)

创建新的 Socket 事件处理器，处理以下事件：

#### 事件列表

1. **`create_poll`** - 创建投票
   - 接收参数：
     ```javascript
     {
       text: "投票标题",  // 消息文本
       options: ["选项1", "选项2", "选项3"],  // 选项数组（2-10个）
       expiresAt: 1234567890  // 可选：截止时间戳
     }
     ```
   - 处理流程：
     1. 验证选项数量（2-10个）
     2. 验证选项文本长度（每个选项最多100字符）
     3. 创建消息（通过 messageService）
     4. 创建投票（通过 db.polls.createPoll）
     5. 广播投票消息给房间内所有用户
   - 返回：成功/失败响应

2. **`vote`** - 投票
   - 接收参数：
     ```javascript
     {
       pollId: 123,  // 投票ID
       optionId: 456  // 选项ID
     }
     ```
   - 处理流程：
     1. 验证投票是否存在且未过期
     2. 检查用户是否已投票（允许改投）
     3. 如果已投票，删除旧投票记录
     4. 创建新投票记录
     5. 获取最新投票结果
     6. 广播更新后的投票结果给房间内所有用户
   - 返回：成功/失败响应

3. **`get_poll_results`** - 获取投票结果（可选，用于刷新）
   - 接收参数：
     ```javascript
     {
       pollId: 123
     }
     ```
   - 返回：投票结果数据

### 3.3 消息类型扩展

在 `services/messageService.js` 中扩展消息类型检测：
- 检测投票消息（通过消息内容或特殊标记）
- 投票消息的 `content_type` 可以设置为 `'poll'`

### 3.4 Socket 事件注册

在 `socket/index.js` 中注册投票相关的事件处理器。

---

## 四、前端实现规划

### 4.1 投票控制器 (`public/js/modules/pollController.js`)

创建新的前端模块，负责投票相关的UI交互：

#### 核心功能
- `init()` - 初始化投票功能
- `showCreatePollModal()` - 显示创建投票模态框
- `handleCreatePoll(data)` - 处理创建投票请求
- `handleVote(pollId, optionId)` - 处理投票操作
- `renderPollMessage(message, pollData)` - 渲染投票消息
- `updatePollResults(pollId, results)` - 更新投票结果显示

### 4.2 创建投票UI

#### 模态框结构
- 投票标题输入框（可选，如果不需要标题则使用消息文本）
- 选项输入框（动态添加/删除，最少2个，最多10个）
- 每个选项文本长度限制（100字符）
- 可选：截止时间选择器
- 创建按钮和取消按钮

#### 验证规则
- 选项数量：2-10个
- 选项文本：非空，最多100字符
- 选项不能重复

### 4.3 投票消息渲染

#### 消息结构
```html
<div class="cyber-message poll-message" data-poll-id="123">
  <div class="poll-header">
    <span class="poll-title">投票标题</span>
    <span class="poll-meta">已投票: 5人</span>
  </div>
  <div class="poll-options">
    <div class="poll-option" data-option-id="456">
      <div class="poll-option-text">选项1</div>
      <div class="poll-option-bar">
        <div class="poll-option-progress" style="width: 60%"></div>
      </div>
      <div class="poll-option-stats">3票 (60%)</div>
    </div>
    <!-- 更多选项... -->
  </div>
  <div class="poll-footer">
    <button class="poll-vote-btn">投票</button>
  </div>
</div>
```

#### 交互逻辑
- 点击选项进行投票
- 已投票的选项高亮显示
- 实时更新投票结果（通过 Socket 事件）
- 显示投票人数和得票率

### 4.4 Socket 事件监听

在 `public/js/modules/socketManager.js` 中添加投票相关的事件监听：

```javascript
// 监听投票结果更新
this.socket.on("poll_results", (data) => {
  // data: { pollId, results, totalVotes }
  onPollResults?.(data);
});

// 监听投票消息
this.socket.on("poll_message", (data) => {
  // data: { message, poll }
  onPollMessage?.(data);
});
```

### 4.5 UI适配器扩展

在 `public/uiAdapter.js` 中添加投票消息的渲染函数：
- `renderPollMessage(container, message, pollData, isMyMessage)`
- 处理投票结果的进度条显示
- 处理已投票状态的视觉反馈

---

## 五、实现步骤

### 阶段1：数据库层（预计1-2天）

1. ✅ 创建 `db/polls.js` 模块
   - 实现所有数据库操作函数
   - 添加错误处理和事务支持

2. ✅ 更新 `db/migrations.js`
   - 添加投票相关表的创建逻辑
   - 添加索引创建逻辑

3. ✅ 更新 `db/index.js`
   - 导出投票相关的数据库操作接口

4. ✅ 测试数据库操作
   - 测试创建投票
   - 测试投票操作
   - 测试查询投票结果
   - 测试级联删除

### 阶段2：后端Socket事件处理（预计2-3天）

1. ✅ 创建 `socket/handlers/poll.js`
   - 实现 `create_poll` 事件处理
   - 实现 `vote` 事件处理
   - 实现 `get_poll_results` 事件处理（可选）

2. ✅ 更新 `socket/index.js`
   - 注册投票事件处理器

3. ✅ 扩展 `services/messageService.js`
   - 支持投票消息类型

4. ✅ 测试后端功能
   - 测试创建投票流程
   - 测试投票流程
   - 测试实时结果推送

### 阶段3：前端UI实现（预计3-4天）

1. ✅ 创建 `public/js/modules/pollController.js`
   - 实现投票控制器逻辑

2. ✅ 创建投票模态框HTML
   - 在 `public/index.html` 中添加创建投票模态框

3. ✅ 扩展 `public/js/modules/socketManager.js`
   - 添加投票相关的事件监听和发送方法

4. ✅ 扩展 `public/uiAdapter.js`
   - 添加投票消息渲染函数

5. ✅ 更新 `public/js/app.js`
   - 集成投票控制器
   - 添加创建投票按钮和事件绑定

6. ✅ 添加投票相关CSS样式
   - 在 `public/cyberStyles.css` 中添加投票样式

7. ✅ 测试前端功能
   - 测试创建投票UI
   - 测试投票交互
   - 测试实时结果更新

### 阶段4：优化和测试（预计1-2天）

1. ✅ 性能优化
   - 优化投票结果查询SQL
   - 添加投票结果缓存（可选）

2. ✅ 边界情况处理
   - 处理投票过期
   - 处理消息删除时的投票清理
   - 处理房间清空时的投票清理

3. ✅ 用户体验优化
   - 添加加载状态
   - 添加错误提示
   - 优化移动端体验

4. ✅ 完整测试
   - 多用户同时投票测试
   - 投票结果实时更新测试
   - 边界情况测试

---

## 六、技术细节

### 6.1 投票消息标识

投票消息可以通过以下方式标识：
1. **方案A（推荐）**：在消息的 `text` 字段中存储特殊标记，如 `[POLL:123]`，其中123是投票ID
2. **方案B**：在消息对象中添加 `pollId` 字段（需要修改数据库结构）
3. **方案C**：通过查询 `polls` 表，根据 `message_id` 判断消息是否为投票消息

**推荐使用方案C**，因为：
- 不需要修改现有消息表结构
- 逻辑清晰，投票和消息分离
- 便于查询和管理

### 6.2 投票结果实时更新

当用户投票时：
1. 后端处理投票请求
2. 更新数据库
3. 查询最新投票结果
4. 通过 Socket.IO 广播 `poll_results` 事件给房间内所有用户
5. 前端接收到事件后更新UI

### 6.3 防止重复投票

使用 `UNIQUE(option_id, session_id)` 约束防止同一session对同一选项重复投票。

**改投逻辑**：
- 如果用户已投票，允许改投其他选项
- 实现方式：先删除旧投票记录，再创建新投票记录

### 6.4 投票过期处理

如果投票设置了截止时间：
- 前端显示剩余时间
- 后端在投票时检查是否过期
- 过期后禁止投票，但可以查看结果

---

## 七、文件清单

### 新增文件
- `db/polls.js` - 投票数据库操作模块
- `socket/handlers/poll.js` - 投票Socket事件处理器
- `public/js/modules/pollController.js` - 前端投票控制器

### 修改文件
- `db/migrations.js` - 添加投票表创建逻辑
- `db/index.js` - 导出投票相关接口
- `socket/index.js` - 注册投票事件处理器
- `services/messageService.js` - 扩展消息类型支持
- `public/js/modules/socketManager.js` - 添加投票事件监听
- `public/uiAdapter.js` - 添加投票消息渲染
- `public/js/app.js` - 集成投票功能
- `public/index.html` - 添加创建投票模态框
- `public/cyberStyles.css` - 添加投票样式

---

## 八、验收标准

### 功能验收
- ✅ 可以创建投票（2-10个选项）
- ✅ 可以参与投票（一人一票）
- ✅ 可以改投其他选项
- ✅ 投票结果实时更新
- ✅ 显示投票人数和得票率
- ✅ 投票结果可视化（进度条）
- ✅ 投票消息正确渲染
- ✅ 移动端体验良好

### 性能验收
- ✅ 投票操作响应时间 < 200ms
- ✅ 投票结果查询时间 < 100ms
- ✅ 不影响聊天消息发送性能

### 边界情况验收
- ✅ 投票过期后禁止投票
- ✅ 消息删除时自动清理投票
- ✅ 房间清空时自动清理投票
- ✅ 选项数量限制有效
- ✅ 选项文本长度限制有效

---

## 九、后续优化（可选）

1. **投票结果缓存**
   - 使用内存缓存投票结果，减少数据库查询
   - 缓存失效策略：投票时更新缓存

2. **投票统计**
   - 显示每个选项的投票用户列表（可选）
   - 显示投票趋势图（可选）

3. **投票模板**
   - 提供常用投票模板（如：是/否、评分1-5等）

4. **投票导出**
   - 导出投票结果为CSV或JSON

---

## 十、注意事项

1. **零认证原则**：使用 `session_id` 而非 `user_id`，符合项目设计理念
2. **性能考虑**：投票结果查询需要JOIN多个表，注意索引优化
3. **数据一致性**：使用事务确保投票创建和投票操作的原子性
4. **向后兼容**：确保新功能不影响现有聊天功能
5. **错误处理**：完善的错误处理和用户提示

---

**规划完成时间**: 2025-01-12

