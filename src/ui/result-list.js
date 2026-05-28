(() => {
  function createResultList(results, options = {}) {
    const list = document.createElement('div');
    const isCompact = Boolean(options.compact);
    list.className = isCompact ? 'pagedot-results pagedot-results-compact' : 'pagedot-results';

    const maxScore = Math.max(...results.map((result) => result.score || 0), 1);

    results.forEach((result, index) => {
      const button = document.createElement('button');
      button.className = 'pagedot-result';
      button.type = 'button';
      button.appendChild(createResultHeader(result, index, maxScore));
      button.appendChild(createResultText(result.text));
      button.addEventListener('click', () => options.onSelect?.(result));
      list.appendChild(button);
    });

    return list;
  }

  function createResultHeader(result, index, maxScore) {
    const header = document.createElement('span');
    header.className = 'pagedot-result-header';

    const label = document.createElement('span');
    label.className = 'pagedot-result-label';
    label.textContent = `${result.meta || 'Treffer'} ${index + 1}`;

    const score = document.createElement('span');
    score.className = 'pagedot-result-score';
    if (typeof result.score === 'number') {
      score.textContent = `${getRelativeScore(result.score, maxScore)}%`;
      score.title = `Raw score: ${result.score}`;
    } else {
      score.textContent = result.meta || result.type || 'Fund';
    }

    header.append(label, score);
    return header;
  }

  function createResultText(text) {
    const textElement = document.createElement('span');
    textElement.className = 'pagedot-result-text';
    textElement.textContent = text;
    return textElement;
  }

  function getRelativeScore(score, maxScore) {
    return Math.max(1, Math.round(((score || 0) / maxScore) * 100));
  }

  window.PageDotResultList = {
    createResultList
  };
})();
