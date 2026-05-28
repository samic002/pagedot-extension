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
    const blocks = collectVisibleTextBlocks(document.body, options.ignoreRootId);
    const bodyText = cleanText(blocks.map((block) => block.text).join(' '));

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
      blocks,
      text
    };
  }

  function collectVisibleTextBlocks(root, ignoreRootId) {
    if (!root) return [];

    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'IFRAME']);
    const ignoredSelector = ignoreRootId ? `#${CSS.escape(ignoreRootId)}` : null;
    const blockSelector = 'article, section, main, aside, header, footer, nav, p, li, td, th, blockquote, pre, h1, h2, h3, h4, h5, h6, div';
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

    const blockMap = new Map();
    while (walker.nextNode()) {
      const text = cleanText(walker.currentNode.textContent || '');
      const element = walker.currentNode.parentElement?.closest(blockSelector) || walker.currentNode.parentElement;
      if (!element) continue;

      const current = blockMap.get(element) || [];
      current.push(text);
      blockMap.set(element, current);
    }

    return Array.from(blockMap.entries())
      .map(([element, parts]) => ({
        element,
        text: cleanText(parts.join(' '))
      }))
      .filter((block) => block.text);
  }

  function cleanText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  window.PageDotContext = {
    collectPageContext
  };
})();
