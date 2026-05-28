(() => {
  const COMMAND_ID = 'links';
  const { collectLinks } = window.PageDotLinkUtils;

  function run() {
    return collectLinks().map((link) => ({
      type: 'link',
      meta: 'Link',
      text: link.label,
      element: link.element,
      href: link.href
    }));
  }

  window.PageDotCommandDefinitions = window.PageDotCommandDefinitions || {};
  window.PageDotCommandDefinitions[COMMAND_ID] = {
    id: COMMAND_ID,
    label: 'Finde Links',
    title: 'Links',
    emptyText: 'Ich habe keine Links auf dieser Seite gefunden.',
    getSubtitle: (count) => `${count} Links auf dieser Seite`,
    getAnswerText: (count) => `Ich habe ${count} Links auf dieser Seite gefunden. Ich zeige sie unten im Ergebnisbereich.`,
    run
  };
})();
