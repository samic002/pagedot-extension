(() => {
  function createCommandMenuController(dom, options = {}) {
    function bind() {
      dom.commandToggle.addEventListener('click', toggle);
      dom.commandMenu.addEventListener('wheel', forwardWheelToMessages, { passive: false });

      dom.commands.forEach((button) => {
        button.addEventListener('click', () => {
          close();
          options.onCommand?.(button.dataset.command);
        });
      });
    }

    function toggle() {
      const isOpen = dom.commandToggle.getAttribute('aria-expanded') === 'true';

      dom.commandToggle.setAttribute('aria-expanded', String(!isOpen));
      dom.commandList.hidden = isOpen;
      dom.commandMenu.classList.toggle('pagedot-command-menu-open', !isOpen);
    }

    function close() {
      dom.commandToggle.setAttribute('aria-expanded', 'false');
      dom.commandList.hidden = true;
      dom.commandMenu.classList.remove('pagedot-command-menu-open');
    }

    function contains(target) {
      return dom.commandMenu.contains(target);
    }

    function forwardWheelToMessages(event) {
      options.onWheel?.(event.deltaY);
      event.preventDefault();
    }

    return {
      bind,
      close,
      contains
    };
  }

  window.PageDotCommandMenu = {
    createCommandMenuController
  };
})();
