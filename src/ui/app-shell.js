(() => {
  function createAppShell({ appId, commands }) {
    const root = document.createElement('div');
    root.id = appId;
    root.className = 'pagedot-root pagedot-closed';
    root.setAttribute('aria-live', 'polite');

    root.innerHTML = `
      <button class="pagedot-orb" type="button" aria-label="Open PageDot assistant">
        <span class="pagedot-orb-glow"></span>
        <span class="pagedot-orb-ring"></span>
        <span class="pagedot-orb-scan"></span>
        <span class="pagedot-orb-core">
          <span class="pagedot-orb-mark">&#10022;</span>
        </span>
      </button>

      <section class="pagedot-panel" role="dialog" aria-label="PageDot assistant">
        <header class="pagedot-header">
          <div class="pagedot-brand">
            <div class="pagedot-avatar"><span>&#10022;</span></div>
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
            ${commands.map((command) => `
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
      panel: root.querySelector('.pagedot-panel'),
      header: root.querySelector('.pagedot-header'),
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

  window.PageDotAppShell = {
    createAppShell
  };
})();
