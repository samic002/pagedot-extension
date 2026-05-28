(() => {
  const APP_ID = 'pagedot-root';
  const STORAGE_KEY = 'pagedot-position';
  const HIGHLIGHT_CLASS = 'pagedot-target-highlight';
  const { collectPageContext } = window.PageDotContext;
  const { createSearchIndex, searchPageContext } = window.PageDotSearch;

  if (document.getElementById(APP_ID)) return;

  const state = {
    isOpen: false,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    movedDuringPointer: false,
    pageContext: null,
    searchIndex: [],
    messages: [
      {
        role: 'assistant',
        text: 'Hi, ich bin PageDot. Ich habe den Inhalt dieser Seite geladen. Frag mich etwas dar\u00fcber.'
      }
    ]
  };

  const dom = createAppShell();
  document.documentElement.appendChild(dom.root);

  restorePosition();
  refreshPageContext();
  renderMessages();
  bindEvents();

  function createAppShell() {
    const root = document.createElement('div');
    root.id = APP_ID;
    root.className = 'pagedot-root pagedot-closed';
    root.setAttribute('aria-live', 'polite');

    root.innerHTML = `
      <button class="pagedot-orb" type="button" aria-label="Open PageDot assistant">
        <span class="pagedot-orb-glow"></span>
        <span class="pagedot-orb-mark">&#10022;</span>
      </button>

      <section class="pagedot-panel" role="dialog" aria-label="PageDot assistant">
        <header class="pagedot-header">
          <div class="pagedot-brand">
            <div class="pagedot-avatar">&#10022;</div>
            <div>
              <div class="pagedot-title">PageDot</div>
              <div class="pagedot-subtitle">Seitensuche aktiv</div>
            </div>
          </div>
          <button class="pagedot-close" type="button" aria-label="Close PageDot">&times;</button>
        </header>

        <main class="pagedot-messages"></main>

        <form class="pagedot-composer">
          <textarea class="pagedot-input" rows="1" placeholder="Frag etwas \u00fcber diese Seite..." aria-label="Message"></textarea>
          <button class="pagedot-send" type="submit" aria-label="Send message">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M3.4 20.3 21 12 3.4 3.7l2.1 6.7L14 12l-8.5 1.6-2.1 6.7Z" fill="currentColor"/>
            </svg>
          </button>
        </form>
      </section>
    `;

    return {
      root,
      orb: root.querySelector('.pagedot-orb'),
      close: root.querySelector('.pagedot-close'),
      messages: root.querySelector('.pagedot-messages'),
      form: root.querySelector('.pagedot-composer'),
      input: root.querySelector('.pagedot-input')
    };
  }

  function bindEvents() {
    dom.orb.addEventListener('pointerdown', startDrag);
    dom.root.querySelector('.pagedot-header').addEventListener('pointerdown', startDrag);
    window.addEventListener('pointermove', drag);
    window.addEventListener('pointerup', endDrag);

    dom.orb.addEventListener('click', () => {
      if (!state.movedDuringPointer) openPanel();
    });

    dom.close.addEventListener('click', closePanel);

    document.addEventListener('pointerdown', (event) => {
      if (state.isOpen && !dom.root.contains(event.target)) closePanel();
    });

    dom.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = dom.input.value.trim();
      if (!message) return;

      addMessage('user', message);
      dom.input.value = '';
      resizeInput();

      const answer = await answerQuestion(message);
      addMessage('assistant', answer.text, answer.results);
    });

    dom.input.addEventListener('input', resizeInput);
    dom.input.addEventListener('keydown', submitOnEnter);
  }

  function refreshPageContext() {
    const refresh = () => {
      state.pageContext = collectPageContext({ ignoreRootId: APP_ID });
      state.searchIndex = createSearchIndex(state.pageContext);
      console.log('[PageDot] Page context loaded:', {
        characters: state.pageContext.text.length,
        chunks: state.searchIndex.length
      });
    };

    refresh();

    if (document.readyState !== 'complete') {
      window.addEventListener('load', refresh, { once: true });
      setTimeout(refresh, 1500);
    }
  }

  async function answerQuestion(message) {
    console.log('[PageDot] User message:', message);

    if (!state.searchIndex.length) {
      return {
        text: 'Ich konnte auf dieser Seite keinen durchsuchbaren Text finden.',
        results: []
      };
    }

    const results = searchPageContext(message, state.searchIndex);
    if (!results.length) {
      return {
        text: 'Ich habe dazu im Seiteninhalt nichts Passendes gefunden.',
        results: []
      };
    }

    return {
      text: `Ich habe die Seite nach "${message}" durchsucht. Klick auf einen Treffer, um zur Stelle zu springen.`,
      results
    };
  }

  function submitOnEnter(event) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    dom.form.requestSubmit();
  }

  function addMessage(role, text, results = []) {
    state.messages.push({ role, text, results });
    renderMessages();
  }

  function renderMessages() {
    dom.messages.innerHTML = '';

    for (const message of state.messages) {
      const bubble = document.createElement('div');
      bubble.className = `pagedot-message pagedot-message-${message.role}`;
      bubble.textContent = message.text;

      if (message.results?.length) {
        bubble.appendChild(createResultList(message.results));
      }

      dom.messages.appendChild(bubble);
    }

    dom.messages.scrollTop = dom.messages.scrollHeight;
  }

  function createResultList(results) {
    const list = document.createElement('div');
    list.className = 'pagedot-results';

    results.forEach((result, index) => {
      const button = document.createElement('button');
      button.className = 'pagedot-result';
      button.type = 'button';
      button.textContent = `${index + 1}. ${result.text}`;
      button.addEventListener('click', () => scrollToResult(result));
      list.appendChild(button);
    });

    return list;
  }

  function scrollToResult(result) {
    const target = result.element;
    if (!target || !document.documentElement.contains(target)) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    target.classList.remove(HIGHLIGHT_CLASS);
    target.getBoundingClientRect();
    target.classList.add(HIGHLIGHT_CLASS);

    setTimeout(() => {
      target.classList.remove(HIGHLIGHT_CLASS);
    }, 1800);
  }

  function openPanel() {
    state.isOpen = true;
    constrainCurrentPosition();
    dom.root.classList.remove('pagedot-closed');
    dom.root.classList.add('pagedot-open');
    setTimeout(() => dom.input.focus(), 80);
  }

  function closePanel() {
    state.isOpen = false;
    dom.root.classList.remove('pagedot-open');
    dom.root.classList.add('pagedot-closed');
  }

  function startDrag(event) {
    if (state.isOpen && event.target.closest('.pagedot-close, .pagedot-composer, .pagedot-messages')) return;

    state.isDragging = true;
    state.movedDuringPointer = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const rect = dom.root.getBoundingClientRect();
    state.dragOffsetX = event.clientX - rect.left;
    state.dragOffsetY = event.clientY - rect.top;
  }

  function drag(event) {
    if (!state.isDragging) return;

    state.movedDuringPointer = true;

    const bounds = getMovementBounds();
    const left = clamp(event.clientX - state.dragOffsetX, bounds.minLeft, bounds.maxLeft);
    const top = clamp(event.clientY - state.dragOffsetY, bounds.minTop, bounds.maxTop);

    setRootPosition(left, top);
  }

  function endDrag() {
    if (!state.isDragging) return;
    state.isDragging = false;

    const rect = dom.root.getBoundingClientRect();
    chrome.storage?.local?.set?.({ [STORAGE_KEY]: { left: rect.left, top: rect.top } });

    setTimeout(() => {
      state.movedDuringPointer = false;
    }, 0);
  }

  function restorePosition() {
    const fallback = {
      left: window.innerWidth - 88,
      top: 96
    };

    chrome.storage?.local?.get?.(STORAGE_KEY, (result) => {
      const saved = result?.[STORAGE_KEY] ?? fallback;
      const bounds = getMovementBounds(false);
      setRootPosition(
        clamp(saved.left, bounds.minLeft, bounds.maxLeft),
        clamp(saved.top, bounds.minTop, bounds.maxTop)
      );
    });

    setRootPosition(fallback.left, fallback.top);
  }

  function constrainCurrentPosition() {
    const rect = dom.root.getBoundingClientRect();
    const bounds = getMovementBounds(true);
    setRootPosition(
      clamp(rect.left, bounds.minLeft, bounds.maxLeft),
      clamp(rect.top, bounds.minTop, bounds.maxTop)
    );
  }

  function getMovementBounds(forceOpen = state.isOpen) {
    const margin = 12;
    const orbSize = 64;

    if (!forceOpen) {
      return {
        minLeft: margin,
        maxLeft: window.innerWidth - orbSize - margin,
        minTop: margin,
        maxTop: window.innerHeight - orbSize - margin
      };
    }

    const panelWidth = Math.min(380, window.innerWidth - 28);
    const panelHeight = Math.min(560, window.innerHeight - 28);
    const anchorOffset = orbSize / 2;

    return {
      minLeft: margin + panelWidth / 2 - anchorOffset,
      maxLeft: window.innerWidth - margin - panelWidth / 2 - anchorOffset,
      minTop: margin,
      maxTop: window.innerHeight - panelHeight - margin
    };
  }

  function setRootPosition(left, top) {
    dom.root.style.left = `${left}px`;
    dom.root.style.top = `${top}px`;
    dom.root.style.right = 'auto';
    dom.root.style.bottom = 'auto';
  }

  function resizeInput() {
    dom.input.style.height = 'auto';
    dom.input.style.height = `${Math.min(dom.input.scrollHeight, 120)}px`;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();
