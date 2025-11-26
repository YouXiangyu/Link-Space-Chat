/**
 * MessageController - 处理消息回复与发送流程
 */

export function createMessageController({
  socketManager,
  state,
  messageMap,
  elements,
  helpers
}) {
  const {
    messages,
    messageForm,
    messageInput,
    rateLimitToast,
    replyBar,
    replyPreviewText,
    cancelReplyBtn,
    sendButton
  } = elements;

  const { renderMessage, showRateLimitToast, cyberTheme } = helpers;

  function startReply(msg) {
    state.replyingTo = msg;
    const previewText = `${msg.nickname}: ${msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text}`;

    if (replyPreviewText) {
      replyPreviewText.textContent = `REPLYING TO: ${previewText}`;
    }

    if (cyberTheme?.showReplyBar) {
      cyberTheme.showReplyBar(previewText);
    } else if (replyBar) {
      replyBar.classList.remove('hidden');
    }

    if (messageInput) messageInput.focus();
  }

  function cancelReply() {
    state.replyingTo = null;

    if (cyberTheme?.hideReplyBar) {
      cyberTheme.hideReplyBar();
    } else if (replyBar) {
      replyBar.classList.add('hidden');
    }
  }

  function bindInputShortcuts() {
    if (!messageInput) return;

    const updateSendButton = () => {
      if (!sendButton) return;
      const hasText = messageInput.value.trim().length > 0;
      if (hasText) {
        sendButton.classList.add('has-text');
      } else {
        sendButton.classList.remove('has-text');
      }
    };

    messageInput.addEventListener("input", updateSendButton);
    messageInput.addEventListener("keyup", updateSendButton);

    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (messageForm) messageForm.dispatchEvent(new Event("submit"));
      }
    });

    updateSendButton();
  }

  function handleMessageSubmit(e) {
    e.preventDefault();
    if (!state.joined) {
      alert("请先加入房间");
      return;
    }

    const text = messageInput ? messageInput.value.trim() : "";
    if (!text) return;

    const isHighlighted = /^#\s+.+/.test(text.trim());
    const tempId = Date.now();
    const clientId = `${tempId}-${Math.random().toString(36).slice(2, 8)}`;
    state.myClientId = clientId;

    if (messages) {
      renderMessage(messages, {
        nickname: "",
        text: text,
        createdAt: Date.now(),
        id: tempId,
        status: 'sending',
        clientId,
        parentMessageId: state.replyingTo ? state.replyingTo.id : null,
        isHighlighted
      }, true, messageMap);
    }

    socketManager.sendMessage({
      text,
      clientId,
      parentMessageId: state.replyingTo ? state.replyingTo.id : null,
      isHighlighted
    }, (resp) => {
      if (!resp?.ok) {
        if (messages) {
          const msgEl = messages.querySelector(`[data-message-id="${tempId}"], [data-client-id="${clientId}"]`);
          if (msgEl) msgEl.remove();
        }

        if (resp?.error === "rate_limit") {
          if (rateLimitToast) {
            showRateLimitToast(rateLimitToast);
          }
        } else {
          console.error(resp?.error || resp?.message);
          alert(resp?.message || "发送失败");
        }
      } else {
        cancelReply();
      }
    });

    if (messageInput) messageInput.value = "";
  }

  function init() {
    if (messageForm) {
      messageForm.addEventListener("submit", handleMessageSubmit);
    }
    if (cancelReplyBtn) {
      cancelReplyBtn.addEventListener("click", cancelReply);
    }
    bindInputShortcuts();
  }

  return {
    init,
    startReply,
    cancelReply
  };
}



