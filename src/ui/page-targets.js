(() => {
  const { HIGHLIGHT_CLASS } = window.PageDotConfig;

  function scrollToResult(result) {
    const target = result.element;
    if (!target || !document.documentElement.contains(target)) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    target.classList.remove(HIGHLIGHT_CLASS);
    target.getBoundingClientRect();
    target.classList.add(HIGHLIGHT_CLASS);

    setTimeout(() => {
      target.classList.remove(HIGHLIGHT_CLASS);
    }, 1800);
  }

  window.PageDotPageTargets = {
    scrollToResult
  };
})();
