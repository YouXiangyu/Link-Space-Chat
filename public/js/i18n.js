/**
 * 国际化语言配置
 * 创建时间: 2025-01-12
 */

const translations = {
  en: {
    // 加密状态
    'encrypted': 'Encrypted // TLS 1.3',
    
    // 侧边栏
    'connectedTo': 'CONNECTED TO:',
    'roomInfo': 'ROOM INFO',
    'activeNodes': 'ACTIVE NODES',
    'shareRoom': 'SHARE ROOM',
    'leaveRoom': 'LEAVE ROOM',
    'search': 'SEARCH',
    'projectInfo': 'PROJECT INFO',
    'uptime': 'UPTIME:',
    'editRoom': 'EDIT ROOM',
    'developedBy': '由 Do It Dui Team 开发',
    
    // 登录界面
    'secureConnectionProtocol': 'SECURE CONNECTION PROTOCOL v1.0',
    'identity': 'IDENTITY',
    'enterAlias': 'ENTER ALIAS...',
    'targetNode': 'TARGET_NODE (ROOM ID)',
    'encryptionKey': 'ENCRYPTION KEY',
    'optional': 'OPTIONAL',
    'global': 'GLOBAL',
    'initializeLink': 'Initialize Link',
    
    // 顶部栏
    'toggleTheme': '切换主题',
    'settings': '设置',
    'language': 'Language',
    
    // 消息区域
    'systemReady': 'SYSTEM READY. AWAITING INPUT.',
    'replyingTo': 'REPLYING TO TARGET...',
    'cancel': 'CANCEL [ESC]',
    'executeCommand': 'EXECUTE COMMAND...',
    'send': 'SEND',
    'copy': 'COPY',
    
    // 模态框
    'passwordRequired': 'PASSWORD REQUIRED',
    'passwordRequiredDesc': '该房间需要密码才能加入',
    'enterPassword': '请输入房间密码',
    'confirm': 'CONFIRM',
    'cancelBtn': 'CANCEL',
    'messageSearch': 'MESSAGE SEARCH',
    'enterKeyword': 'ENTER KEYWORD...',
    'joinRoom': 'JOIN ROOM',
    'nickname': 'Nickname',
    'enterNickname': 'Please enter nickname',
    'roomId': 'Room ID',
    'roomPassword': 'Room Password',
    'ifPassword': 'Enter password if required',
    
    // 编辑房间
    'editRoomTitle': 'EDIT ROOM',
    'saveWarning': 'After saving, room name, description and password cannot be changed.',
    'roomName': 'Room Name',
    'roomNamePlaceholder': 'Room Name (Optional)',
    'roomDescription': 'Room Description',
    'roomDescriptionPlaceholder': 'Room Description (Optional)',
    'roomPasswordLabel': 'Room Password',
    'roomPasswordPlaceholder': 'Leave empty for public room',
    'passwordNote': 'After setting a password, only users who know the password can join. Default room (ID "1") cannot have a password.',
    'modifyPassword': 'Modify password and clear chat history',
    'modifyPasswordNote': 'To protect privacy, modifying the password will immediately clear all chat history in this room.',
    'save': 'SAVE',
    
    // 项目信息
    'projectInfoTitle': 'PROJECT INFO',
    'projectInfoDesc': 'Visit our open source repository to learn more about project progress and documentation:',
    'githubRepo': 'GitHub Repository: Link-Space-Chat',
    
    // 其他
    'rateLimitExceeded': 'MESSAGE RATE LIMIT EXCEEDED',
    'connectionDisconnected': 'Connection disconnected, please refresh the page and try again',
    'connectionError': 'Unable to connect to server, please check network connection. Error: ',
    'pleaseEnterNickname': 'Please enter a nickname',
    'socketNotLoaded': 'Socket.io not loaded, please refresh the page and try again'
  },
  zh: {
    // 加密状态
    'encrypted': '已加密 // TLS 1.3',
    
    // 侧边栏
    'connectedTo': '已连接到:',
    'roomInfo': '房间信息',
    'activeNodes': '在线用户',
    'shareRoom': '分享房间',
    'leaveRoom': '离开房间',
    'search': '搜索',
    'projectInfo': '项目信息',
    'uptime': '运行时间:',
    'editRoom': '编辑房间',
    'developedBy': '由 Do It Dui Team 开发',
    
    // 登录界面
    'secureConnectionProtocol': '安全连接协议 v1.0',
    'identity': '身份标识',
    'enterAlias': '输入别名...',
    'targetNode': '目标节点 (房间ID)',
    'encryptionKey': '加密密钥',
    'optional': '可选',
    'global': '全局',
    'initializeLink': '初始化连接',
    
    // 顶部栏
    'toggleTheme': '切换主题',
    'settings': '设置',
    'language': '语言',
    
    // 消息区域
    'systemReady': '系统就绪。等待输入。',
    'replyingTo': '正在回复目标...',
    'cancel': '取消 [ESC]',
    'executeCommand': '执行命令...',
    'send': '发送',
    'copy': '复制',
    
    // 模态框
    'passwordRequired': '需要密码',
    'passwordRequiredDesc': '该房间需要密码才能加入',
    'enterPassword': '请输入房间密码',
    'confirm': '确认',
    'cancelBtn': '取消',
    'messageSearch': '消息搜索',
    'enterKeyword': '输入关键词...',
    'joinRoom': '加入房间',
    'nickname': '昵称',
    'enterNickname': '请输入昵称',
    'roomId': '房间ID',
    'roomPassword': '房间密码',
    'ifPassword': '如有密码请填写',
    
    // 编辑房间
    'editRoomTitle': '编辑房间',
    'saveWarning': '确认保存后，房间名称、描述与密码将不可改动。',
    'roomName': '房间名称',
    'roomNamePlaceholder': '房间名称（可选）',
    'roomDescription': '房间描述',
    'roomDescriptionPlaceholder': '房间描述（可选）',
    'roomPasswordLabel': '房间密码',
    'roomPasswordPlaceholder': '留空表示开放房间',
    'passwordNote': '设置密码后，只有知道密码的用户才能加入。默认房间（ID为"1"）不能设置密码。',
    'modifyPassword': '修改密码并清空聊天记录',
    'modifyPasswordNote': '为保护隐私，修改密码会立即清空本房间全部聊天记录。',
    'save': '保存',
    
    // 项目信息
    'projectInfoTitle': '项目信息',
    'projectInfoDesc': '访问我们的开源仓库以了解更多项目进展与文档：',
    'githubRepo': 'GitHub 仓库：Link-Space-Chat',
    
    // 其他
    'rateLimitExceeded': '消息发送频率超限',
    'connectionDisconnected': '连接已断开，请刷新页面重试',
    'connectionError': '无法连接到服务器，请检查网络连接。错误: ',
    'pleaseEnterNickname': '请输入一个昵称',
    'socketNotLoaded': 'Socket.io未加载，请刷新页面重试'
  }
};

// 当前语言，默认为英文
let currentLanguage = localStorage.getItem('language') || 'en';

/**
 * 获取翻译文本
 * @param {string} key - 翻译键
 * @returns {string} 翻译后的文本
 */
export function t(key) {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

/**
 * 设置语言
 * @param {string} lang - 语言代码 ('en' 或 'zh')
 */
export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updatePageText();
  }
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * 更新页面上的所有文本
 */
function updatePageText() {
  // 更新加密状态
  const encryptionStatus = document.getElementById('encryption-status');
  if (encryptionStatus) {
    encryptionStatus.textContent = t('encrypted');
  }
  
  // 更新所有使用 data-i18n 属性的元素
  updateAllTexts();
}

/**
 * 更新所有文本内容
 */
function updateAllTexts() {
  // 使用 data-i18n 属性来标记需要翻译的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });
  
  // 更新 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.placeholder = t(key);
    }
  });
  
  // 更新 title 属性
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.title = t(key);
    }
  });
}

// 初始化时更新文本
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updatePageText();
  });
} else {
  updatePageText();
}

// 导出更新函数供外部调用
export { updatePageText };

