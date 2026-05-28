(() => {
  const { APP_ID, WELCOME_MESSAGE } = window.PageDotConfig;
  const { collectPageContext } = window.PageDotContext;
  const { createSearchIndex, searchPageContext } = window.PageDotSearch;
  const { getAll: getCommands, run: runRegisteredCommand } = window.PageDotCommands;
  const { createAppShell } = window.PageDotAppShell;
  const { createCommandMenuController } = window.PageDotCommandMenu;
  const { renderMessages: renderMessageList } = window.PageDotMessageList;
  const { createPositionController } = window.PageDotPosition;
  const { createResultDrawerController } = window.PageDotResultDrawer;
  const { createResultList } = window.PageDotResultList;
  const { scrollToResult } = window.PageDotPageTargets;

  if (document.getElementById(APP_ID)) return;

  const panelState = { isOpen: false };
  const state = {
    pageContext: null,
    searchIndex: [],
    messages: [{ role: 'assistant', text: WELCOME_MESSAGE }]
  };

  const dom = createAppShell({
    appId: APP_ID,
    commands: getCommands()
  });
  document.documentElement.appendChild(dom.root);

  const position = createPositionController(dom, panelState);
  const resultDrawer = createResultDrawerController(dom, {
    createResultList,
    onResultSelect: scrollToResult
  });
  const commandMenu = createCommandMenuController(dom, {
    onCommand: runCommand,
    onWheel: (deltaY) => {
      dom.messages.scrollTop += deltaY;
    }
  });

  position.bind();
  resultDrawer.bind();
  commandMenu.bind();
  bindEvents();

  position.restorePosition();
  refreshPageContext();
  renderMessages();

  function bindEvents() {
    dom.orb.addEventListener('click', () => {
      if (!position.wasMovedDuringPointer()) openPanel();
    });
    dom.close.addEventListener('click', closePanel);

    document.addEventListener('pointerdown', (event) => {
      if (panelState.isOpen && !commandMenu.contains(event.target)) commandMenu.close();
      if (panelState.isOpen && !dom.root.contains(event.target)) closePanel();
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

  function runCommand(commandId) {
    refreshPageContext();

    const commandAnswer = runRegisteredCommand(commandId, {
      pageContext: state.pageContext
    });
    if (!commandAnswer) return;

    addMessage('user', commandAnswer.command.label);
    addMessage('assistant', commandAnswer.text);

    if (commandAnswer.results.length) {
      resultDrawer.show(commandAnswer);
    } else {
      resultDrawer.close();
    }
  }

  function addMessage(role, text, results = []) {
    state.messages.push({ role, text, results });
    renderMessages();
  }

  function renderMessages() {
    renderMessageList({
      container: dom.messages,
      createResultList,
      messages: state.messages,
      onResultSelect: scrollToResult
    });
  }

  function openPanel() {
    panelState.isOpen = true;
    position.constrainCurrentPosition();
    dom.root.classList.remove('pagedot-closed');
    dom.root.classList.add('pagedot-open');
    setTimeout(() => dom.input.focus(), 80);
  }

  function closePanel() {
    panelState.isOpen = false;
    dom.root.classList.remove('pagedot-open');
    dom.root.classList.add('pagedot-closed');
  }

  function submitOnEnter(event) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    dom.form.requestSubmit();
  }

  function resizeInput() {
    dom.input.style.height = 'auto';
    dom.input.style.height = `${Math.min(dom.input.scrollHeight, 120)}px`;
  }
})();
