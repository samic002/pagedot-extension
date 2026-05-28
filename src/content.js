(() => {
  const APP_ID = 'pagedot-root';
  const STORAGE_KEY = 'pagedot-position';
  const HIGHLIGHT_CLASS = 'pagedot-target-highlight';
  const { collectPageContext } = window.PageDotContext;
  const { createSearchIndex, searchPageContext } = window.PageDotSearch;
  const COMMANDS = [
    { id: 'dates', label: 'Finde Datumsangaben' },
    { id: 'links', label: 'Finde Links' },
    { id: 'subpages', label: 'Finde Unterseiten' }
  ];

  if (document.getElementById(APP_ID)) return;

  const state = {
    isOpen: false,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    isResizingResults: false,
    resultDrawerHeight: 158,
    movedDuringPointer: false,
    pageContext: null,
    searchIndex: [],
    resultDrawer: {
      isOpen: false,
      title: '',
      subtitle: '',
      results: []
    },
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

        <section class="pagedot-result-drawer" aria-label="Command results" hidden>
          <div class="pagedot-result-resize" role="separator" aria-label="Resize results" aria-orientation="horizontal"></div>
          <header class="pagedot-result-drawer-header">
            <div>
              <div class="pagedot-result-drawer-title"></div>
              <div class="pagedot-result-drawer-subtitle"></div>
            </div>
            <button class="pagedot-result-drawer-close" type="button" aria-label="Close results">&times;</button>
          </header>
          <div class="pagedot-result-drawer-list"></div>
        </section>

        <div class="pagedot-command-menu">
          <button class="pagedot-command-toggle" type="button" aria-expanded="false">
            <span class="pagedot-command-toggle-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="13" height="13">
                <path d="M4 7h16M7 12h10M10 17h4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </span>
            <span>Commands</span>
            <span class="pagedot-command-toggle-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="12" height="12">
                <path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </button>
          <div class="pagedot-commands" aria-label="PageDot commands" hidden>
            ${COMMANDS.map((command) => `
              <button class="pagedot-command" type="button" data-command="${command.id}">
                ${command.label}
              </button>
            `).join('')}
          </div>
        </div>

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
      commandMenu: root.querySelector('.pagedot-command-menu'),
      commandToggle: root.querySelector('.pagedot-command-toggle'),
      commandList: root.querySelector('.pagedot-commands'),
      commands: root.querySelectorAll('.pagedot-command'),
      resultDrawer: root.querySelector('.pagedot-result-drawer'),
      resultResize: root.querySelector('.pagedot-result-resize'),
      resultDrawerTitle: root.querySelector('.pagedot-result-drawer-title'),
      resultDrawerSubtitle: root.querySelector('.pagedot-result-drawer-subtitle'),
      resultDrawerClose: root.querySelector('.pagedot-result-drawer-close'),
      resultDrawerList: root.querySelector('.pagedot-result-drawer-list'),
      messages: root.querySelector('.pagedot-messages'),
      form: root.querySelector('.pagedot-composer'),
      input: root.querySelector('.pagedot-input')
    };
  }

  function bindEvents() {
    dom.orb.addEventListener('pointerdown', startDrag);
    dom.root.querySelector('.pagedot-header').addEventListener('pointerdown', startDrag);
    window.addEventListener('pointermove', drag);
    window.addEventListener('pointermove', resizeResultDrawer);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointerup', endResultResize);

    dom.orb.addEventListener('click', () => {
      if (!state.movedDuringPointer) openPanel();
    });

    dom.close.addEventListener('click', closePanel);
    dom.commandToggle.addEventListener('click', toggleCommandMenu);
    dom.commandMenu.addEventListener('wheel', scrollMessagesFromOverlay, { passive: false });
    dom.resultDrawerClose.addEventListener('click', closeResultDrawer);
    dom.resultResize.addEventListener('pointerdown', startResultResize);
    dom.commands.forEach((button) => {
      button.addEventListener('click', () => runCommand(button.dataset.command));
    });

    document.addEventListener('pointerdown', (event) => {
      if (state.isOpen && !dom.commandMenu.contains(event.target)) closeCommandMenu();
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

  function runCommand(commandId) {
    const command = COMMANDS.find((item) => item.id === commandId);
    if (!command) return;

    refreshPageContext();
    addMessage('user', command.label);
    closeCommandMenu();

    const answer = answerCommand(commandId);
    addMessage('assistant', answer.text);
    if (answer.results.length) {
      showResultDrawer(answer.title, answer.subtitle, answer.results);
    } else {
      closeResultDrawer();
    }
  }

  function toggleCommandMenu() {
    const isOpen = dom.commandToggle.getAttribute('aria-expanded') === 'true';

    dom.commandToggle.setAttribute('aria-expanded', String(!isOpen));
    dom.commandList.hidden = isOpen;
    dom.commandMenu.classList.toggle('pagedot-command-menu-open', !isOpen);
  }

  function closeCommandMenu() {
    dom.commandToggle.setAttribute('aria-expanded', 'false');
    dom.commandList.hidden = true;
    dom.commandMenu.classList.remove('pagedot-command-menu-open');
  }

  function scrollMessagesFromOverlay(event) {
    dom.messages.scrollTop += event.deltaY;
    event.preventDefault();
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

  function answerCommand(commandId) {
    const commandHandlers = {
      dates: findDates,
      links: findLinks,
      subpages: findSubpages
    };
    const results = commandHandlers[commandId]?.() || [];

    if (!results.length) {
      return {
        title: getCommandTitle(commandId),
        subtitle: '',
        text: getEmptyCommandText(commandId),
        results: []
      };
    }

    return {
      title: getCommandTitle(commandId),
      subtitle: getCommandSubtitle(commandId, results.length),
      text: getCommandAnswerText(commandId, results.length),
      results
    };
  }

  function findDates() {
    const datePattern = /\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\.\s*(?:januar|februar|m\u00e4rz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)\s+\d{4})\b/gi;
    const seen = new Set();

    return state.pageContext.blocks.flatMap((block) => {
      const matches = block.text.match(datePattern) || [];

      return matches.map((match) => {
        const date = match.trim();
        const key = `${date}|${block.text}`;
        if (seen.has(key)) return null;
        seen.add(key);

        return {
          type: 'date',
          meta: 'Datum',
          text: `${date} - ${getSnippetAround(block.text, date)}`,
          element: block.element
        };
      }).filter(Boolean);
    });
  }

  function findLinks() {
    return collectLinks()
      .map((link) => ({
        type: 'link',
        meta: 'Link',
        text: link.label,
        element: link.element,
        href: link.href
      }));
  }

  function findSubpages() {
    return collectLinks()
      .filter((link) => link.url.origin === window.location.origin)
      .filter((link) => link.url.pathname !== window.location.pathname || link.url.search)
      .map((link) => ({
        type: 'subpage',
        meta: 'Unterseite',
        text: link.label,
        element: link.element,
        href: link.href
      }));
  }

  function collectLinks() {
    const seen = new Set();

    return Array.from(document.querySelectorAll('a[href]'))
      .filter((anchor) => !anchor.closest(`#${APP_ID}`))
      .map((anchor) => {
        try {
          const url = new URL(anchor.href, window.location.href);
          if (!['http:', 'https:'].includes(url.protocol)) return null;
          if (isSamePageAnchor(url)) return null;

          const href = url.href;
          if (seen.has(href)) return null;
          seen.add(href);

          return {
            element: anchor,
            href,
            url,
            label: getLinkLabel(anchor, href)
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  function getLinkLabel(anchor, href) {
    const text = anchor.innerText || anchor.textContent || anchor.getAttribute('aria-label') || '';
    return text.trim().replace(/\s+/g, ' ') || href;
  }

  function isSamePageAnchor(url) {
    return Boolean(
      url.hash &&
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    );
  }

  function getSnippetAround(text, needle) {
    const index = text.toLowerCase().indexOf(needle.toLowerCase());
    if (index < 0) return text.slice(0, 160);

    const start = Math.max(0, index - 70);
    const end = Math.min(text.length, index + needle.length + 90);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    return `${prefix}${text.slice(start, end).trim()}${suffix}`;
  }

  function getCommandAnswerText(commandId, count) {
    const labels = {
      dates: `Ich habe ${count} Datumsfundstellen gefunden.`,
      links: `Ich habe ${count} Links auf dieser Seite gefunden.`,
      subpages: `Ich habe ${count} verlinkte Unterseiten dieser Website gefunden.`
    };

    return `${labels[commandId]} Ich zeige sie unten im Ergebnisbereich.`;
  }

  function getEmptyCommandText(commandId) {
    const labels = {
      dates: 'Ich habe keine Datumsangaben auf dieser Seite gefunden.',
      links: 'Ich habe keine Links auf dieser Seite gefunden.',
      subpages: 'Ich habe keine verlinkten Unterseiten dieser Website gefunden.'
    };

    return labels[commandId] || 'Ich habe dazu nichts gefunden.';
  }

  function getCommandTitle(commandId) {
    const labels = {
      dates: 'Datumsangaben',
      links: 'Links',
      subpages: 'Unterseiten'
    };

    return labels[commandId] || 'Ergebnisse';
  }

  function getCommandSubtitle(commandId, count) {
    const labels = {
      dates: `${count} Fundstellen auf dieser Seite`,
      links: `${count} Links auf dieser Seite`,
      subpages: `${count} interne Links auf dieser Website`
    };

    return labels[commandId] || `${count} Ergebnisse`;
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

  function showResultDrawer(title, subtitle, results) {
    state.resultDrawer = {
      isOpen: Boolean(results.length),
      title,
      subtitle,
      results
    };

    renderResultDrawer();
  }

  function closeResultDrawer() {
    state.resultDrawer.isOpen = false;
    renderResultDrawer();
  }

  function renderResultDrawer() {
    dom.resultDrawer.hidden = !state.resultDrawer.isOpen;
    dom.root.classList.toggle('pagedot-has-results', state.resultDrawer.isOpen);

    if (!state.resultDrawer.isOpen) {
      dom.resultDrawerList.innerHTML = '';
      return;
    }

    dom.resultDrawerTitle.textContent = state.resultDrawer.title;
    dom.resultDrawerSubtitle.textContent = state.resultDrawer.subtitle;
    setResultDrawerHeight(state.resultDrawerHeight);
    dom.resultDrawerList.innerHTML = '';
    dom.resultDrawerList.appendChild(createResultList(state.resultDrawer.results, true));
  }

  function startResultResize(event) {
    state.isResizingResults = true;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function resizeResultDrawer(event) {
    if (!state.isResizingResults) return;

    const panelRect = dom.root.querySelector('.pagedot-panel').getBoundingClientRect();
    const composerHeight = dom.form.getBoundingClientRect().height + 24;
    const headerHeight = dom.root.querySelector('.pagedot-header').getBoundingClientRect().height;
    const maxHeight = Math.max(170, panelRect.height - headerHeight - composerHeight - 78);
    const nextHeight = panelRect.bottom - composerHeight - event.clientY;

    setResultDrawerHeight(clamp(nextHeight, 120, maxHeight));
  }

  function endResultResize() {
    state.isResizingResults = false;
  }

  function setResultDrawerHeight(height) {
    state.resultDrawerHeight = height;
    dom.resultDrawer.style.height = `${height}px`;
    dom.root.style.setProperty('--pagedot-result-drawer-height', `${height}px`);
  }

  function createResultList(results, isCompact = false) {
    const list = document.createElement('div');
    list.className = isCompact ? 'pagedot-results pagedot-results-compact' : 'pagedot-results';
    const maxScore = Math.max(...results.map((result) => result.score || 0), 1);

    results.forEach((result, index) => {
      const button = document.createElement('button');
      button.className = 'pagedot-result';
      button.type = 'button';
      button.appendChild(createResultHeader(result, index, maxScore));
      button.appendChild(createResultText(result.text));
      button.addEventListener('click', () => scrollToResult(result));
      list.appendChild(button);
    });

    return list;
  }

  function createResultHeader(result, index, maxScore) {
    const header = document.createElement('span');
    header.className = 'pagedot-result-header';

    const label = document.createElement('span');
    label.className = 'pagedot-result-label';
    label.textContent = `${result.meta || 'Treffer'} ${index + 1}`;

    const score = document.createElement('span');
    score.className = 'pagedot-result-score';
    if (typeof result.score === 'number') {
      score.textContent = `${getRelativeScore(result.score, maxScore)}%`;
      score.title = `Raw score: ${result.score}`;
    } else {
      score.textContent = result.meta || result.type || 'Fund';
    }

    header.append(label, score);
    return header;
  }

  function createResultText(text) {
    const textElement = document.createElement('span');
    textElement.className = 'pagedot-result-text';
    textElement.textContent = text;
    return textElement;
  }

  function getRelativeScore(score, maxScore) {
    return Math.max(1, Math.round(((score || 0) / maxScore) * 100));
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
