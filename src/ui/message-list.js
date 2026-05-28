(() => {
  function renderMessages({ container, messages, createResultList, onResultSelect }) {
    container.innerHTML = '';

    for (const message of messages) {
      const bubble = document.createElement('div');
      bubble.className = `pagedot-message pagedot-message-${message.role}`;
      bubble.textContent = message.text;

      if (message.results?.length) {
        bubble.appendChild(createResultList(message.results, {
          onSelect: onResultSelect
        }));
      }

      container.appendChild(bubble);
    }

    container.scrollTop = container.scrollHeight;
  }

  window.PageDotMessageList = {
    renderMessages
  };
})();
