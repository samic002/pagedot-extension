(() => {
  const { INITIAL_RESULT_DRAWER_HEIGHT } = window.PageDotConfig;
  const { clamp } = window.PageDotUtils;

  function createResultDrawerController(dom, options = {}) {
    const state = {
      height: INITIAL_RESULT_DRAWER_HEIGHT,
      filteredResults: [],
      filterText: '',
      isOpen: false,
      isResizing: false,
      results: [],
      subtitle: '',
      title: ''
    };

    function bind() {
      dom.resultDrawerClose.addEventListener('click', close);
      dom.resultFilterInput.addEventListener('input', updateFilter);
      dom.resultResize.addEventListener('pointerdown', startResize);
      window.addEventListener('pointermove', resize);
      window.addEventListener('pointerup', endResize);
    }

    function show({ title, subtitle, results }) {
      state.isOpen = Boolean(results.length);
      state.title = title;
      state.subtitle = subtitle;
      state.results = results;
      state.filterText = '';
      state.filteredResults = results;
      dom.resultFilterInput.value = '';
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
      dom.resultDrawerSubtitle.textContent = getSubtitle();
      setHeight(state.height);
      dom.resultDrawerList.innerHTML = '';
      if (!state.filteredResults.length) {
        dom.resultDrawerList.appendChild(createEmptyFilterMessage());
        return;
      }

      dom.resultDrawerList.appendChild(options.createResultList(state.filteredResults, {
        compact: true,
        onSelect: options.onResultSelect
      }));
    }

    function updateFilter() {
      state.filterText = dom.resultFilterInput.value;
      state.filteredResults = filterResults(state.results, state.filterText);
      render();
    }

    function filterResults(results, query) {
      const normalizedQuery = normalize(query);
      if (!normalizedQuery) return results;

      return results.filter((result) => {
        return normalize(`${result.text || ''} ${result.href || ''} ${result.meta || ''}`).includes(normalizedQuery);
      });
    }

    function getSubtitle() {
      if (!state.filterText.trim()) return state.subtitle;
      return `${state.filteredResults.length} von ${state.results.length} Ergebnissen`;
    }

    function createEmptyFilterMessage() {
      const message = document.createElement('div');
      message.className = 'pagedot-result-empty';
      message.textContent = 'Keine Ergebnisse fuer diesen Filter.';
      return message;
    }

    function normalize(value) {
      return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
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
