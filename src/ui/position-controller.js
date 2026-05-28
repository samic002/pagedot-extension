(() => {
  const { STORAGE_KEY } = window.PageDotConfig;
  const { clamp } = window.PageDotUtils;

  function createPositionController(dom, panelState) {
    const dragState = {
      isDragging: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      movedDuringPointer: false
    };

    function bind() {
      dom.orb.addEventListener('pointerdown', startDrag);
      dom.header.addEventListener('pointerdown', startDrag);
      window.addEventListener('pointermove', drag);
      window.addEventListener('pointerup', endDrag);
    }

    function wasMovedDuringPointer() {
      return dragState.movedDuringPointer;
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

    function startDrag(event) {
      if (panelState.isOpen && event.target.closest('.pagedot-close, .pagedot-composer, .pagedot-messages')) return;

      dragState.isDragging = true;
      dragState.movedDuringPointer = false;
      event.currentTarget.setPointerCapture?.(event.pointerId);

      const rect = dom.root.getBoundingClientRect();
      dragState.dragOffsetX = event.clientX - rect.left;
      dragState.dragOffsetY = event.clientY - rect.top;
    }

    function drag(event) {
      if (!dragState.isDragging) return;

      dragState.movedDuringPointer = true;

      const bounds = getMovementBounds();
      const left = clamp(event.clientX - dragState.dragOffsetX, bounds.minLeft, bounds.maxLeft);
      const top = clamp(event.clientY - dragState.dragOffsetY, bounds.minTop, bounds.maxTop);

      setRootPosition(left, top);
    }

    function endDrag() {
      if (!dragState.isDragging) return;
      dragState.isDragging = false;

      const rect = dom.root.getBoundingClientRect();
      chrome.storage?.local?.set?.({ [STORAGE_KEY]: { left: rect.left, top: rect.top } });

      setTimeout(() => {
        dragState.movedDuringPointer = false;
      }, 0);
    }

    function getMovementBounds(forceOpen = panelState.isOpen) {
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

    return {
      bind,
      constrainCurrentPosition,
      restorePosition,
      wasMovedDuringPointer
    };
  }

  window.PageDotPosition = {
    createPositionController
  };
})();
