(() => {
  const { APP_ID } = window.PageDotConfig;

  function collectLinks() {
    const seen = new Set();

    return Array.from(document.querySelectorAll('a[href]'))
      .filter((anchor) => !anchor.closest(`#${APP_ID}`))
      .map((anchor) => normalizeLink(anchor, seen))
      .filter(Boolean);
  }

  function normalizeLink(anchor, seen) {
    try {
      const url = new URL(anchor.href, window.location.href);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (isSamePageAnchor(url)) return null;

      const href = url.href;
      if (seen.has(href)) return null;
      seen.add(href);

      return {
        element: anchor,
        href,
        url,
        label: getLinkLabel(anchor, href)
      };
    } catch {
      return null;
    }
  }

  function getLinkLabel(anchor, href) {
    const text = anchor.innerText || anchor.textContent || anchor.getAttribute('aria-label') || '';
    return text.trim().replace(/\s+/g, ' ') || href;
  }

  function isSamePageAnchor(url) {
    return Boolean(
      url.hash &&
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    );
  }

  window.PageDotLinkUtils = {
    collectLinks
  };
})();
