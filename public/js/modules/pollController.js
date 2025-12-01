/**
 * PollController - 处理投票相关的UI交互
 * 创建时间: 2025-01-12
 */

export function createPollController({
  socketManager,
  state,
  messageMap,
  elements,
  helpers
}) {
  const { renderPollMessage, updatePollResults } = helpers;

  /**
   * 显示创建投票模态框
   */
  function showCreatePollModal() {
    const modal = elements.createPollModal;
    if (!modal) return;

    // 重置表单
    if (elements.pollTitleInput) elements.pollTitleInput.value = '';
    if (elements.pollOptionsContainer) {
      elements.pollOptionsContainer.innerHTML = '';
      // 添加初始的两个选项输入框
      addPollOption();
      addPollOption();
    }
    if (elements.pollExpiresAtInput) elements.pollExpiresAtInput.value = '';

    // 显示模态框
    modal.classList.remove('hidden');
    if (elements.pollTitleInput) elements.pollTitleInput.focus();
  }

  /**
   * 隐藏创建投票模态框
   */
  function hideCreatePollModal() {
    const modal = elements.createPollModal;
    if (!modal) return;
    modal.classList.add('hidden');
  }

  /**
   * 添加投票选项输入框
   */
  function addPollOption() {
    const container = elements.pollOptionsContainer;
    if (!container) return;

    const optionCount = container.children.length;
    if (optionCount >= 10) {
      alert('最多只能添加10个选项');
      return;
    }

    const optionDiv = document.createElement('div');
    optionDiv.className = 'poll-option-input-group';
    optionDiv.innerHTML = `
      <input type="text" class="poll-option-input" placeholder="选项 ${optionCount + 1}" maxlength="100">
      <button type="button" class="poll-option-remove-btn" ${optionCount < 2 ? 'disabled' : ''}>×</button>
    `;

    // 绑定删除按钮事件
    const removeBtn = optionDiv.querySelector('.poll-option-remove-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        if (container.children.length > 2) {
          optionDiv.remove();
          updateRemoveButtons();
        }
      });
    }

    container.appendChild(optionDiv);
    updateRemoveButtons();

    // 聚焦到新添加的输入框
    const input = optionDiv.querySelector('.poll-option-input');
    if (input) input.focus();
  }

  /**
   * 更新删除按钮状态（至少保留2个选项）
   */
  function updateRemoveButtons() {
    const container = elements.pollOptionsContainer;
    if (!container) return;

    const optionCount = container.children.length;
    container.querySelectorAll('.poll-option-remove-btn').forEach(btn => {
      btn.disabled = optionCount <= 2;
    });
  }

  /**
   * 处理创建投票
   */
  function handleCreatePoll() {
    if (!state.joined) {
      alert('请先加入房间');
      return;
    }

    const title = elements.pollTitleInput ? elements.pollTitleInput.value.trim() : '';
    if (!title) {
      alert('请输入投票标题');
      return;
    }

    // 收集选项
    const options = [];
    const optionInputs = elements.pollOptionsContainer ? 
      elements.pollOptionsContainer.querySelectorAll('.poll-option-input') : [];
    
    optionInputs.forEach(input => {
      const text = input.value.trim();
      if (text) {
        options.push(text);
      }
    });

    if (options.length < 2) {
      alert('至少需要2个选项');
      return;
    }

    if (options.length > 10) {
      alert('最多只能有10个选项');
      return;
    }

    // 检查选项是否重复
    const uniqueOptions = [...new Set(options)];
    if (uniqueOptions.length !== options.length) {
      alert('投票选项不能重复');
      return;
    }

    // 获取截止时间（可选）
    let expiresAt = null;
    if (elements.pollExpiresAtInput && elements.pollExpiresAtInput.value) {
      const date = new Date(elements.pollExpiresAtInput.value);
      if (!isNaN(date.getTime()) && date.getTime() > Date.now()) {
        expiresAt = date.getTime();
      } else {
        alert('截止时间必须是将来的时间');
        return;
      }
    }

    // 发送创建投票请求
    socketManager.createPoll({
      text: title,
      options: options,
      expiresAt: expiresAt
    }, (resp) => {
      if (!resp?.ok) {
        alert(resp?.message || '创建投票失败');
        return;
      }

      // 创建成功，隐藏模态框
      hideCreatePollModal();
    });
  }

  /**
   * 处理投票操作
   */
  function handleVote(pollId, optionId) {
    if (!state.joined) {
      alert('请先加入房间');
      return;
    }

    socketManager.vote({
      pollId,
      optionId
    }, (resp) => {
      if (!resp?.ok) {
        if (resp?.error === 'POLL_EXPIRED') {
          alert('投票已过期');
        } else {
          alert(resp?.message || '投票失败');
        }
      }
      // 投票结果会通过 Socket 事件自动更新
    });
  }

  /**
   * 初始化
   */
  function init() {
    // 绑定创建投票按钮
    if (elements.createPollBtn) {
      elements.createPollBtn.addEventListener('click', () => {
        showCreatePollModal();
      });
    }

    // 绑定移动端创建投票按钮
    if (elements.mobileCreatePollBtn) {
      elements.mobileCreatePollBtn.addEventListener('click', () => {
        showCreatePollModal();
      });
    }

    // 绑定创建投票表单提交
    if (elements.createPollForm) {
      elements.createPollForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleCreatePoll();
      });
    }

    // 绑定添加选项按钮
    if (elements.addPollOptionBtn) {
      elements.addPollOptionBtn.addEventListener('click', () => {
        addPollOption();
      });
    }

    // 绑定取消按钮
    if (elements.cancelCreatePollBtn) {
      elements.cancelCreatePollBtn.addEventListener('click', () => {
        hideCreatePollModal();
      });
    }

    // 绑定关闭按钮（点击模态框外部）
    if (elements.createPollModal) {
      elements.createPollModal.addEventListener('click', (e) => {
        if (e.target === elements.createPollModal) {
          hideCreatePollModal();
        }
      });
    }
  }

  return {
    init,
    showCreatePollModal,
    hideCreatePollModal,
    handleVote,
    handleCreatePoll
  };
}



