# PageDot

A clean Chrome/Edge Manifest V3 browser-extension starter with a draggable floating orb and a beautiful chat panel.

## What it does now

- Shows a draggable orb on every website
- Opens a chat-style panel on click
- Collapses back to the orb when clicking outside or closing
- Accepts user input
- Calls `handleUserMessage(message)`
- Logs the message to the browser console
- Replies with `done`

## Install locally

1. Open Chrome or Edge.
2. Go to `chrome://extensions` or `edge://extensions`.
3. Enable Developer Mode.
4. Click “Load unpacked”.
5. Select this folder: `pagedot-extension`.

## Extension structure

```text
manifest.json
src/
  content.js   # UI creation, state, drag behavior, message handler
  styles.css   # full visual design
```

## Where to extend later

Start with this function in `src/content.js`:

```js
async function handleUserMessage(message) {
  console.log('[PageDot] User message:', message);
  return 'done';
}
```

Later this can call page extraction, semantic search, embeddings, or an API.
