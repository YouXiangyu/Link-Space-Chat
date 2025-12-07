/**
 * Cyber Theme Manager - 主题状态管理和DOM操作
 * 创建时间: 2025-01-12
 * 
 * 负责管理Cyber主题的UI状态、元素引用和事件绑定
 */

// 全局主题状态
export const cyberTheme = {
  isActive: true,
  joined: false,
  currentRoom: null,
  myNickname: null,
  myClientId: null,

  // DOM元素引用
  elements: {
    loginOverlay: null,
    mainInterface: null,
    messages: null,
    messageInput: null,
    messageForm: null,
    replyBar: null,
    replyPreviewText: null,
    cancelReplyBtn: null,
    rateLimitToast: null,
    sidebar: null,
    mobileSidebar: null,
    mobileSidebarOverlay: null,
    currentRoomName: null,
    roomIdLabel: null,
    userList: null,
    mobileUserList: null,
    roomInfo: null,
    mobileRoomInfo: null,
    shareBtn: null,
    mobileShareBtn: null,
    leaveBtn: null,
    mobileLeaveBtn: null,
    searchToggleBtn: null,
    mobileSearchToggleBtn: null,
    searchPanel: null,
    editRoomBtn: null,
    mobileEditRoomBtn: null,
    joinBtn: null,
    nicknameInput: null,
    roomIdInput: null,
    roomPasswordInput: null
  },

  /**
   * 初始化主题
   */
  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.setupCursor();
    this.setupUptime();
    this.loadSavedTheme();
  },

  /**
   * 缓存DOM元素引用
   */
  cacheElements() {
    this.elements.loginOverlay = document.getElementById('login-overlay');
    this.elements.mainInterface = document.getElementById('main-interface');
    this.elements.messages = document.getElementById('messages');
    this.elements.messageInput = document.getElementById('messageInput');
    this.elements.messageForm = document.getElementById('messageForm');
    this.elements.replyBar = document.getElementById('reply-bar');
    this.elements.replyPreviewText = document.getElementById('replyPreviewText');
    this.elements.cancelReplyBtn = document.getElementById('cancelReplyBtn');
    this.elements.rateLimitToast = document.getElementById('rateLimitToast');
    this.elements.sidebar = document.getElementById('sidebar');
    this.elements.mobileSidebar = document.getElementById('mobile-sidebar');
    this.elements.mobileSidebarOverlay = document.getElementById('sidebar-overlay');
    this.elements.currentRoomName = document.getElementById('current-room-name');
    this.elements.roomIdLabel = document.getElementById('roomIdLabel');
    this.elements.userList = document.getElementById('userList');
    this.elements.mobileUserList = document.getElementById('mobile-userList');
    this.elements.roomInfo = document.getElementById('roomInfo');
    this.elements.mobileRoomInfo = document.getElementById('mobile-roomInfo');
    this.elements.shareBtn = document.getElementById('shareBtn');
    this.elements.mobileShareBtn = document.getElementById('mobile-shareBtn');
    this.elements.leaveBtn = document.getElementById('leaveBtn');
    this.elements.mobileLeaveBtn = document.getElementById('mobile-leaveBtn');
    this.elements.searchToggleBtn = document.getElementById('searchToggleBtn');
    this.elements.mobileSearchToggleBtn = document.getElementById('mobile-searchToggleBtn');
    this.elements.searchPanel = document.getElementById('searchPanel');
    this.elements.editRoomBtn = document.getElementById('editRoomBtn');
    this.elements.mobileEditRoomBtn = document.getElementById('mobile-editRoomBtn');
    this.elements.joinBtn = document.getElementById('joinBtn');
    this.elements.nicknameInput = document.getElementById('nickname');
    this.elements.roomIdInput = document.getElementById('roomIdInput');
    this.elements.roomPasswordInput = document.getElementById('roomPasswordInput');
  },

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 移动端菜单
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileSidebarClose = document.getElementById('mobile-sidebar-close');

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        this.openMobileSidebar();
      });
    }

    if (mobileSidebarClose) {
      mobileSidebarClose.addEventListener('click', () => {
        this.closeMobileSidebar();
      });
    }

    if (this.elements.mobileSidebarOverlay) {
      this.elements.mobileSidebarOverlay.addEventListener('click', () => {
        this.closeMobileSidebar();
      });
    }

    // 桌面端侧边栏关闭按钮
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    if (sidebarCloseBtn) {
      sidebarCloseBtn.addEventListener('click', () => {
        this.closeSidebar();
      });
    }

    // 设置按钮 - 根据窗口大小决定打开桌面端侧边栏或移动端侧边栏
    const settingsToggle = document.getElementById('settings-toggle');
    if (settingsToggle) {
      settingsToggle.addEventListener('click', () => {
        // 小窗口模式下（<=768px）使用移动端侧边栏，否则使用桌面端侧边栏
        if (window.innerWidth <= 768) {
          this.openMobileSidebar();
        } else {
          this.toggleSidebar();
        }
      });
    }

    // 主题按钮 - 切换主题
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // ESC键取消回复、关闭搜索面板
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.elements.replyBar && !this.elements.replyBar.classList.contains('hidden')) {
          if (window.eventBus && typeof window.eventBus.emit === 'function') {
            window.eventBus.emit('message:cancelReply');
          } else if (window.cancelReply && typeof window.cancelReply === 'function') {
            // 兼容旧版本
            window.cancelReply();
          }
        }
        if (this.elements.searchPanel && !this.elements.searchPanel.classList.contains('hidden')) {
          this.closeSearchPanel();
        }
      }
    });

    // 处理移动端虚拟键盘
    this.setupMobileKeyboardHandling();
  },

  /**
   * 处理移动端虚拟键盘弹出时的布局调整
   */
  setupMobileKeyboardHandling() {
    if (!this.elements.messageInput || !this.elements.messages) return;

    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    let keyboardVisible = false;

    // 监听输入框聚焦
    this.elements.messageInput.addEventListener('focus', () => {
      keyboardVisible = true;
      // 延迟滚动，确保键盘已弹出
      setTimeout(() => {
        if (this.elements.messages) {
          // 滚动到底部，确保输入框可见
          this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }
      }, 300);
    });

    // 监听输入框失焦
    this.elements.messageInput.addEventListener('blur', () => {
      keyboardVisible = false;
    });

    // 使用 Visual Viewport API（如果可用）来检测键盘
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const currentHeight = window.visualViewport.height;
        const heightDiff = initialViewportHeight - currentHeight;
        
        // 如果高度差超过150px，认为键盘已弹出
        if (heightDiff > 150) {
          keyboardVisible = true;
          // 确保消息区域可以滚动
          if (this.elements.messages) {
            setTimeout(() => {
              this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            }, 100);
          }
        } else {
          keyboardVisible = false;
        }
      });
    }

    // 监听窗口大小变化（备用方案）
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (keyboardVisible && this.elements.messages) {
          this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }
      }, 100);
    });
  },

  /**
   * 设置自定义光标
   */
  setupCursor() {
    const cursor = document.getElementById('cursor');
    if (!cursor) return;

    document.addEventListener('mousemove', (e) => {
      if (typeof gsap !== 'undefined') {
        gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
      } else {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      }
    });
  },

  /**
   * 设置运行时间计数器
   */
  setupUptime() {
    const uptimeCounter = document.getElementById('uptime-counter');
    if (!uptimeCounter) return;

    const startTime = Date.now();
    setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      uptimeCounter.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
  },

  /**
   * 进入主界面（加入房间后调用）
   */
  enterInterface() {
    if (!this.elements.loginOverlay || !this.elements.mainInterface) return;

    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline();
      tl.to(this.elements.loginOverlay, { opacity: 0, duration: 0.5, pointerEvents: "none" })
        .to(this.elements.mainInterface, {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          pointerEvents: "all",
          duration: 0.8
        }, "-=0.2");
    } else {
      this.elements.loginOverlay.style.display = 'none';
      this.elements.mainInterface.style.opacity = '1';
      this.elements.mainInterface.style.scale = '1';
      this.elements.mainInterface.style.filter = 'blur(0px)';
      this.elements.mainInterface.style.pointerEvents = 'all';
    }

    this.joined = true;
  },

  /**
   * 离开房间（返回登录界面）
   */
  leaveInterface() {
    if (!this.elements.loginOverlay || !this.elements.mainInterface) return;

    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline();
      tl.to(this.elements.mainInterface, {
        opacity: 0,
        scale: 0.95,
        filter: "blur(10px)",
        pointerEvents: "none",
        duration: 0.5
      })
        .to(this.elements.loginOverlay, { opacity: 1, duration: 0.5, pointerEvents: "all" }, "-=0.2");
    } else {
      this.elements.mainInterface.style.opacity = '0';
      this.elements.mainInterface.style.scale = '0.95';
      this.elements.mainInterface.style.filter = 'blur(10px)';
      this.elements.mainInterface.style.pointerEvents = 'none';
      this.elements.loginOverlay.style.display = 'flex';
      this.elements.loginOverlay.style.opacity = '1';
      this.elements.loginOverlay.style.pointerEvents = 'all';
    }

    this.joined = false;
    this.currentRoom = null;
  },

  /**
   * 更新房间信息显示
   */
  updateRoomInfo(room) {
    this.currentRoom = room;

    if (!room) {
      if (this.elements.currentRoomName) {
        this.elements.currentRoomName.textContent = 'LOBBY';
      }
      if (this.elements.roomIdLabel) {
        this.elements.roomIdLabel.textContent = '';
      }
      return;
    }

    if (this.elements.currentRoomName) {
      this.elements.currentRoomName.textContent = (room.name || room.id || 'UNNAMED').toUpperCase();
    }

    if (this.elements.roomIdLabel) {
      this.elements.roomIdLabel.textContent = `ID: ${room.id}`;
    }

    // 更新房间信息卡片
    const roomNameEls = document.querySelectorAll('#roomName, #mobile-roomName');
    const roomDescEls = document.querySelectorAll('#roomDescription, #mobile-roomDescription');
    const roomPwdEls = document.querySelectorAll('#roomPasswordStatus, #mobile-roomPasswordStatus');

    roomNameEls.forEach(el => {
      if (el) el.textContent = room.name || room.id || 'Unnamed Room';
    });

    roomDescEls.forEach(el => {
      if (el) el.textContent = room.description || '';
    });

    roomPwdEls.forEach(el => {
      if (el) {
        el.textContent = room.password ? '🔒 LOCKED' : '🔓 OPEN';
        el.className = room.password ? 'text-xs font-mono text-red-400' : 'text-xs font-mono text-green-400';
      }
    });

    // 显示/隐藏编辑按钮
    const isCreator = room.isCreator === true;
    if (this.elements.editRoomBtn) {
      this.elements.editRoomBtn.style.display = isCreator ? 'block' : 'none';
    }
    if (this.elements.mobileEditRoomBtn) {
      this.elements.mobileEditRoomBtn.style.display = isCreator ? 'block' : 'none';
    }
  },

  /**
   * 显示回复栏
   */
  showReplyBar(replyText) {
    if (!this.elements.replyBar || !this.elements.replyPreviewText) return;

    this.elements.replyPreviewText.textContent = `REPLYING TO: ${replyText}`;
    this.elements.replyBar.classList.remove('hidden');
  },

  /**
   * 隐藏回复栏
   */
  hideReplyBar() {
    if (!this.elements.replyBar) return;
    this.elements.replyBar.classList.add('hidden');
  },

  /**
   * 打开移动端侧边栏
   */
  openMobileSidebar() {
    if (!this.elements.mobileSidebar || !this.elements.mobileSidebarOverlay) return;

    this.elements.mobileSidebarOverlay.style.display = 'block';
    this.elements.mobileSidebar.classList.remove('-translate-x-full');
  },

  /**
   * 关闭移动端侧边栏
   */
  closeMobileSidebar() {
    if (!this.elements.mobileSidebar || !this.elements.mobileSidebarOverlay) return;

    this.elements.mobileSidebarOverlay.style.display = 'none';
    this.elements.mobileSidebar.classList.add('-translate-x-full');
  },

  /**
   * 打开搜索面板
   */
  openSearchPanel() {
    if (!this.elements.searchPanel) return;
    this.elements.searchPanel.classList.remove('hidden');
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.focus();
  },

  /**
   * 关闭搜索面板
   */
  closeSearchPanel() {
    if (!this.elements.searchPanel) return;
    this.elements.searchPanel.classList.add('hidden');
  },

  /**
   * 显示离开房间按钮
   */
  showLeaveButton() {
    if (this.elements.leaveBtn) {
      this.elements.leaveBtn.style.display = 'block';
    }
    if (this.elements.mobileLeaveBtn) {
      this.elements.mobileLeaveBtn.style.display = 'block';
    }
  },

  /**
   * 隐藏离开房间按钮
   */
  hideLeaveButton() {
    if (this.elements.leaveBtn) {
      this.elements.leaveBtn.style.display = 'none';
    }
    if (this.elements.mobileLeaveBtn) {
      this.elements.mobileLeaveBtn.style.display = 'none';
    }
  },

  /**
   * 切换侧边栏显示/隐藏
   */
  toggleSidebar() {
    if (!this.elements.sidebar) return;

    // 检查是否隐藏
    const isHidden = this.elements.sidebar.classList.contains('hidden') ||
      this.elements.sidebar.style.display === 'none';

    if (isHidden) {
      // 显示侧边栏
      this.elements.sidebar.classList.remove('hidden');
      this.elements.sidebar.style.display = 'flex';
    } else {
      // 隐藏侧边栏
      this.closeSidebar();
    }
  },

  /**
   * 关闭侧边栏
   */
  closeSidebar() {
    if (!this.elements.sidebar) return;
    this.elements.sidebar.style.display = 'none';
  },

  /**
   * 加载保存的主题
   */
  loadSavedTheme() {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    }
  },

  /**
   * 切换主题
   */
  toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('app-theme', isLight ? 'light' : 'cyber');

    // 使用独立的主题提示元素
    const themeToast = document.getElementById('themeToast');
    if (themeToast) {
      themeToast.textContent = isLight ? 'SWITCHED TO LIGHT THEME' : 'SWITCHED TO CYBER THEME';
      themeToast.classList.remove('hidden');
      
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(themeToast, 
          { x: 100, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3 }
        );
      }
      
      setTimeout(() => {
        if (typeof gsap !== 'undefined') {
          gsap.to(themeToast, {
            x: 100,
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
              themeToast.classList.add('hidden');
            }
          });
        } else {
          themeToast.classList.add('hidden');
        }
      }, 2000);
    }
  }
};

// 初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => cyberTheme.init());
} else {
  cyberTheme.init();
}

