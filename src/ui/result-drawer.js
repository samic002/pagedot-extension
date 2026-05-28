(() => {
  const { INITIAL_RESULT_DRAWER_HEIGHT } = window.PageDotConfig;
  const { clamp } = window.PageDotUtils;

  function createResultDrawerController(dom, options = {}) {
    const state = {
      height: INITIAL_RESULT_DRAWER_HEIGHT,
      isOpen: false,
      isResizing: false,
      results: [],
      subtitle: '',
      title: ''
    };

    function bind() {
      dom.resultDrawerClose.addEventListener('click', close);
      dom.resultResize.addEventListener('pointerdown', startResize);
      window.addEventListener('pointermove', resize);
      window.addEventListener('pointerup', endResize);
    }

    function show({ title, subtitle, results }) {
      state.isOpen = Boolean(results.length);
      state.title = title;
      state.subtitle = subtitle;
      state.results = results;
      render();
    }

    function close() {
      state.isOpen = false;
      render();
    }

    function render() {
      dom.resultDrawer.hidden = !state.isOpen;
      dom.root.classList.toggle('pagedot-has-results', state.isOpen);

      if (!state.isOpen) {
        dom.resultDrawerList.innerHTML = '';
        return;
      }

      dom.resultDrawerTitle.textContent = state.title;
      dom.resultDrawerSubtitle.textContent = state.subtitle;
      setHeight(state.height);
      dom.resultDrawerList.innerHTML = '';
      dom.resultDrawerList.appendChild(options.createResultList(state.results, {
        compact: true,
        onSelect: options.onResultSelect
      }));
    }

    function startResize(event) {
      state.isResizing = true;
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    function resize(event) {
      if (!state.isResizing) return;

      const panelRect = dom.panel.getBoundingClientRect();
      const composerHeight = dom.form.getBoundingClientRect().height + 24;
      const headerHeight = dom.header.getBoundingClientRect().height;
      const maxHeight = Math.max(170, panelRect.height - headerHeight - composerHeight - 78);
      const nextHeight = panelRect.bottom - composerHeight - event.clientY;

      setHeight(clamp(nextHeight, 120, maxHeight));
    }

    function endResize() {
      state.isResizing = false;
    }

    function setHeight(height) {
      state.height = height;
      dom.resultDrawer.style.height = `${height}px`;
      dom.root.style.setProperty('--pagedot-result-drawer-height', `${height}px`);
    }

    return {
      bind,
      close,
      show
    };
  }

  window.PageDotResultDrawer = {
    createResultDrawerController
  };
})();
