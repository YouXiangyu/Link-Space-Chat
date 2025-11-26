/**
 * ModalManager - 模态框管理
 * 统一管理所有模态框的显示/隐藏逻辑
 */

export class ModalManager {
  constructor(elements) {
    this.elements = {
      shareModal: elements.shareModal,
      editRoomModal: elements.editRoomModal,
      passwordModal: elements.passwordModal,
      prefillJoinModal: elements.prefillJoinModal,
      projectInfoModal: elements.projectInfoModal,
      closeModalBtn: elements.closeModalBtn,
      closeEditModalBtn: elements.closeEditModalBtn,
      cancelPasswordBtn: elements.cancelPasswordBtn,
      prefillCancelBtn: elements.prefillCancelBtn,
      closeProjectInfoBtn: elements.closeProjectInfoBtn
    };
    
    this.init();
  }

  init() {
    this.setupCloseHandlers();
  }

  setupCloseHandlers() {
    // 分享模态框
    if (this.elements.closeModalBtn) {
      this.elements.closeModalBtn.addEventListener('click', () => {
        this.closeShareModal();
      });
    }
    if (this.elements.shareModal) {
      this.elements.shareModal.addEventListener('click', (e) => {
        if (e.target === this.elements.shareModal) {
          this.closeShareModal();
        }
      });
    }

    // 编辑房间模态框
    if (this.elements.closeEditModalBtn) {
      this.elements.closeEditModalBtn.addEventListener('click', () => {
        this.closeEditRoomModal();
      });
    }
    if (this.elements.editRoomModal) {
      this.elements.editRoomModal.addEventListener('click', (e) => {
        if (e.target === this.elements.editRoomModal) {
          this.closeEditRoomModal();
        }
      });
    }

    // 密码模态框
    if (this.elements.cancelPasswordBtn) {
      this.elements.cancelPasswordBtn.addEventListener('click', () => {
        this.closePasswordModal();
      });
    }

    // 预填加入模态框
    if (this.elements.prefillCancelBtn) {
      this.elements.prefillCancelBtn.addEventListener('click', () => {
        this.closePrefillModal();
      });
    }
    if (this.elements.prefillJoinModal) {
      this.elements.prefillJoinModal.addEventListener('click', (e) => {
        if (e.target === this.elements.prefillJoinModal) {
          this.closePrefillModal();
        }
      });
    }

    // 项目信息模态框
    if (this.elements.closeProjectInfoBtn) {
      this.elements.closeProjectInfoBtn.addEventListener('click', () => {
        this.closeProjectInfoModal();
      });
    }
    if (this.elements.projectInfoModal) {
      this.elements.projectInfoModal.addEventListener('click', (e) => {
        if (e.target === this.elements.projectInfoModal) {
          this.closeProjectInfoModal();
        }
      });
    }
  }

  openShareModal() {
    if (this.elements.shareModal) {
      this.elements.shareModal.classList.remove('hidden');
    }
  }

  closeShareModal() {
    if (this.elements.shareModal) {
      this.elements.shareModal.classList.add('hidden');
    }
  }

  openEditRoomModal() {
    if (this.elements.editRoomModal) {
      this.elements.editRoomModal.classList.remove('hidden');
    }
  }

  closeEditRoomModal() {
    if (this.elements.editRoomModal) {
      this.elements.editRoomModal.classList.add('hidden');
    }
  }

  openPasswordModal() {
    if (this.elements.passwordModal) {
      this.elements.passwordModal.classList.remove('hidden');
    }
  }

  closePasswordModal() {
    if (this.elements.passwordModal) {
      this.elements.passwordModal.classList.add('hidden');
    }
  }

  openPrefillModal() {
    if (this.elements.prefillJoinModal) {
      this.elements.prefillJoinModal.classList.remove('hidden');
    }
  }

  closePrefillModal() {
    if (this.elements.prefillJoinModal) {
      this.elements.prefillJoinModal.classList.add('hidden');
    }
  }

  openProjectInfoModal() {
    if (this.elements.projectInfoModal) {
      this.elements.projectInfoModal.classList.remove('hidden');
    }
  }

  closeProjectInfoModal() {
    if (this.elements.projectInfoModal) {
      this.elements.projectInfoModal.classList.add('hidden');
    }
  }
}

