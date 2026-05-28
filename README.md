# PageDot

A clean Chrome/Edge Manifest V3 browser extension with a draggable floating page assistant.

## What it does now

- Shows a draggable orb on every website
- Loads the current page title, URL, meta description, headings, and visible body text as local context
- Builds a small in-memory search index from that page context
- Answers user questions by searching the loaded page content and returning the most relevant snippets
- Opens a chat-style panel on click
- Collapses back to the orb when clicking outside or closing

## Install locally

1. Open Chrome or Edge.
2. Go to `chrome://extensions` or `edge://extensions`.
3. Enable Developer Mode.
4. Click "Load unpacked".
5. Select this folder: `pagedot-extension`.

After code changes, reload the extension on the browser extensions page and refresh the website you want to test.

## Extension structure

```text
manifest.json
src/
  content.js        # UI creation, chat state, drag behavior
  page-context.js   # page title, URL, metadata, headings, visible text extraction
  page-search.js    # chunking, tokenization, scoring, answer formatting
  styles.css   # visual design
```

## Notes

PageDot currently answers from local page text only. It does not call an AI model or external search API yet.
