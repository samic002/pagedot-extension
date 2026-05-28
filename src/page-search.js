(() => {
  const STOP_WORDS = new Set([
    'aber', 'alle', 'alles', 'als', 'also', 'am', 'an', 'auf', 'aus', 'bei', 'bin',
    'bis', 'da', 'das', 'dass', 'dein', 'dem', 'den', 'der', 'des', 'die', 'dies',
    'du', 'ein', 'eine', 'einem', 'einen', 'einer', 'es', 'etwas', 'fuer', 'hat',
    'habe', 'haben', 'ich', 'im', 'in', 'ist', 'ja', 'kann', 'mit', 'nach', 'nicht',
    'oder', 'sich', 'sie', 'sind', 'ueber', 'um', 'und', 'uns', 'von', 'was', 'wer',
    'wie', 'wo', 'zu', 'zum', 'zur', 'the', 'and', 'for', 'from', 'that', 'this',
    'with', 'you', 'your', 'what', 'when', 'where', 'why', 'how'
  ]);

  function createSearchIndex(pageContext) {
    const blocks = pageContext.blocks?.length
      ? pageContext.blocks
      : [{ text: pageContext.text, element: null }];
    const chunks = blocks.flatMap((block) => {
      return chunkText(block.text, 850, 180).map((text) => ({
        text,
        element: block.element || null
      }));
    });

    return chunks.map((chunk, index) => ({
      index,
      text: chunk.text,
      element: chunk.element,
      tokens: tokenize(chunk.text)
    }));
  }

  function searchPageContext(query, searchIndex) {
    const queryTokens = tokenize(query);
    if (!queryTokens.length) return [];

    return searchIndex
      .map((chunk) => scoreChunk(chunk, queryTokens))
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((chunk) => ({
        ...chunk,
        text: pickBestExcerpt(chunk.text, queryTokens)
      }));
  }

  function formatSearchAnswer(query, results) {
    const intro = `Ich habe die Seite nach "${query}" durchsucht.`;
    const snippets = results
      .map((result, index) => `${index + 1}. ${result.text}`)
      .join('\n\n');

    return `${intro}\n\n${snippets}`;
  }

  function scoreChunk(chunk, queryTokens) {
    let score = 0;
    const tokenSet = new Set(chunk.tokens);

    for (const token of queryTokens) {
      if (tokenSet.has(token)) score += 4;

      for (const chunkToken of tokenSet) {
        if (chunkToken !== token && (chunkToken.includes(token) || token.includes(chunkToken))) {
          score += 1;
        }
      }
    }

    return { ...chunk, score };
  }

  function chunkText(text, targetLength, overlap) {
    const normalized = cleanText(text);
    if (!normalized) return [];

    const chunks = [];
    let start = 0;

    while (start < normalized.length) {
      let end = Math.min(start + targetLength, normalized.length);

      if (end < normalized.length) {
        const lastSentenceEnd = Math.max(
          normalized.lastIndexOf('. ', end),
          normalized.lastIndexOf('! ', end),
          normalized.lastIndexOf('? ', end),
          normalized.lastIndexOf('\n', end)
        );
        if (lastSentenceEnd > start + targetLength * 0.55) {
          end = lastSentenceEnd + 1;
        }
      }

      const chunk = cleanText(normalized.slice(start, end));
      if (chunk) chunks.push(chunk);

      if (end >= normalized.length) break;
      start = Math.max(end - overlap, start + 1);
    }

    return chunks;
  }

  function pickBestExcerpt(text, queryTokens) {
    const sentences = text.match(/[^.!?\n]+[.!?]?/g) || [text];
    let bestSentence = sentences[0] || text;
    let bestScore = -1;

    for (const sentence of sentences) {
      const sentenceTokens = tokenize(sentence);
      const score = queryTokens.reduce((sum, token) => {
        return sum + (sentenceTokens.includes(token) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    }

    return truncateText(cleanText(bestSentence), 360);
  }

  function tokenize(text) {
    return cleanText(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u00e4/g, 'ae')
      .replace(/\u00f6/g, 'oe')
      .replace(/\u00fc/g, 'ue')
      .replace(/\u00df/g, 'ss')
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
  }

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3).trim()}...`;
  }

  function cleanText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  window.PageDotSearch = {
    createSearchIndex,
    searchPageContext,
    formatSearchAnswer
  };
})();
