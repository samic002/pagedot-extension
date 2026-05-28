(() => {
  const order = ['dates', 'links', 'subpages'];

  function getAll() {
    return order
      .map((id) => window.PageDotCommandDefinitions?.[id])
      .filter(Boolean);
  }

  function get(id) {
    return window.PageDotCommandDefinitions?.[id] || null;
  }

  function run(id, context) {
    const command = get(id);
    if (!command) return null;

    const results = command.run(context);
    if (!results.length) {
      return {
        command,
        title: command.title,
        subtitle: '',
        text: command.emptyText,
        results: []
      };
    }

    return {
      command,
      title: command.title,
      subtitle: command.getSubtitle(results.length),
      text: command.getAnswerText(results.length),
      results
    };
  }

  window.PageDotCommands = {
    get,
    getAll,
    run
  };
})();
