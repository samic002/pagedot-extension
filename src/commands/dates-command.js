(() => {
  const COMMAND_ID = 'dates';
  const DATE_PATTERN = /\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\.\s*(?:januar|februar|m\u00e4rz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)\s+\d{4})\b/gi;

  function run({ pageContext }) {
    const seen = new Set();

    return pageContext.blocks.flatMap((block) => {
      const matches = block.text.match(DATE_PATTERN) || [];

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

  function getSnippetAround(text, needle) {
    const index = text.toLowerCase().indexOf(needle.toLowerCase());
    if (index < 0) return text.slice(0, 160);

    const start = Math.max(0, index - 70);
    const end = Math.min(text.length, index + needle.length + 90);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    return `${prefix}${text.slice(start, end).trim()}${suffix}`;
  }

  window.PageDotCommandDefinitions = window.PageDotCommandDefinitions || {};
  window.PageDotCommandDefinitions[COMMAND_ID] = {
    id: COMMAND_ID,
    label: 'Finde Datumsangaben',
    title: 'Datumsangaben',
    emptyText: 'Ich habe keine Datumsangaben auf dieser Seite gefunden.',
    getSubtitle: (count) => `${count} Fundstellen auf dieser Seite`,
    getAnswerText: (count) => `Ich habe ${count} Datumsfundstellen gefunden. Ich zeige sie unten im Ergebnisbereich.`,
    run
  };
})();
