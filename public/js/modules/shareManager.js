/**
 * ShareManager - 分享功能管理
 * 处理房间分享、二维码生成、链接复制等功能
 */

export class ShareManager {
  constructor(elements) {
    this.elements = {
      shareModal: elements.shareModal,
      qrCodeContainer: elements.qrCodeContainer,
      shareLinkInput: elements.shareLinkInput,
      copyLinkBtn: elements.copyLinkBtn
    };
    
    this.init();
  }

  init() {
    if (this.elements.copyLinkBtn) {
      this.elements.copyLinkBtn.addEventListener('click', () => {
        this.copyShareLink();
      });
    }
  }

  /**
   * 打开分享模态框
   */
  openShareModal() {
    if (!this.elements.shareModal || !this.elements.qrCodeContainer || !this.elements.shareLinkInput) {
      return;
    }
    
    this.elements.qrCodeContainer.innerHTML = '';
    
    // 生成二维码
    if (typeof QRCode !== 'undefined') {
      QRCode.toCanvas(window.location.href, { width: 200, margin: 1 }, (err, canvas) => {
        if (err) {
          console.error('Failed to generate QR code:', err);
          return;
        }
        this.elements.qrCodeContainer.appendChild(canvas);
      });
    }
    
    // 设置分享链接
    this.elements.shareLinkInput.value = window.location.href;
    this.elements.shareModal.classList.remove('hidden');
  }

  /**
   * 复制分享链接
   */
  async copyShareLink() {
    if (!this.elements.shareLinkInput) return;
    
    try {
      await navigator.clipboard.writeText(this.elements.shareLinkInput.value);
      
      if (this.elements.copyLinkBtn) {
        const originalText = this.elements.copyLinkBtn.textContent;
        this.elements.copyLinkBtn.textContent = 'COPIED!';
        setTimeout(() => {
          this.elements.copyLinkBtn.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('复制失败');
    }
  }
}

