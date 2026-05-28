(() => {
  function collectPageContext(options = {}) {
    const title = cleanText(document.title);
    const description = cleanText(
      document.querySelector('meta[name="description"]')?.content ||
      document.querySelector('meta[property="og:description"]')?.content ||
      ''
    );
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map((heading) => cleanText(heading.innerText || heading.textContent || ''))
      .filter(Boolean);
    const bodyText = collectVisibleText(document.body, options.ignoreRootId);

    const text = [
      title ? `Titel: ${title}` : '',
      `URL: ${window.location.href}`,
      description ? `Beschreibung: ${description}` : '',
      headings.length ? `\u00dcberschriften: ${headings.join(' | ')}` : '',
      bodyText
    ].filter(Boolean).join('\n\n');

    return {
      title,
      url: window.location.href,
      description,
      headings,
      text
    };
  }

  function collectVisibleText(root, ignoreRootId) {
    if (!root) return '';

    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'IFRAME']);
    const ignoredSelector = ignoreRootId ? `#${CSS.escape(ignoreRootId)}` : null;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || ignoredTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
          if (ignoredSelector && parent.closest(ignoredSelector)) return NodeFilter.FILTER_REJECT;

          const text = cleanText(node.textContent || '');
          if (!text) return NodeFilter.FILTER_REJECT;

          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const parts = [];
    while (walker.nextNode()) {
      parts.push(cleanText(walker.currentNode.textContent || ''));
    }

    return cleanText(parts.join(' '));
  }

  function cleanText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  window.PageDotContext = {
    collectPageContext
  };
})();
