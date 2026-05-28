(() => {
  const COMMAND_ID = 'subpages';
  const { collectLinks } = window.PageDotLinkUtils;

  function run() {
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

  window.PageDotCommandDefinitions = window.PageDotCommandDefinitions || {};
  window.PageDotCommandDefinitions[COMMAND_ID] = {
    id: COMMAND_ID,
    label: 'Finde Unterseiten',
    title: 'Unterseiten',
    emptyText: 'Ich habe keine verlinkten Unterseiten dieser Website gefunden.',
    getSubtitle: (count) => `${count} interne Links auf dieser Website`,
    getAnswerText: (count) => `Ich habe ${count} verlinkte Unterseiten dieser Website gefunden. Ich zeige sie unten im Ergebnisbereich.`,
    run
  };
})();
