# ui-locator-overlay

A development-time UI locator overlay for React. Use a hotkey to enter inspect mode, click any element, and get component name, source file, line/column, selector, and text preview.

Works well in Tauri/WebView, Vite, and React admin apps. No browser extension required.

## Docs Navigation

- [English README (current)](https://github.com/coolwork-ai-labs/ui-locator-overlay/blob/main/README_EN.md)
- [中文说明](https://github.com/coolwork-ai-labs/ui-locator-overlay/blob/main/README.md)
- [Chinese user guide](https://github.com/coolwork-ai-labs/ui-locator-overlay/blob/main/README_FOR_USERS.md)
- [GitHub Repository](https://github.com/coolwork-ai-labs/ui-locator-overlay)
- [Issues](https://github.com/coolwork-ai-labs/ui-locator-overlay/issues)

## Install

```bash
npm i @coolwork-ai-labs/ui-locator-overlay
```

## Quick Start (React)

```tsx
import { UiLocatorOverlay } from '@coolwork-ai-labs/ui-locator-overlay';

export default function App() {
  return (
    <>
      {/* your app */}
      {import.meta.env.DEV ? <UiLocatorOverlay /> : null}
    </>
  );
}
```

## Default Interaction

- `Ctrl + Shift + L`: toggle inspect mode (`Command + Shift + L` on macOS)
- Click an element: show inspection details
- `Esc`: exit inspect mode
- Copy button in panel: copy the location payload

## API

```tsx
<UiLocatorOverlay
  enabled={true}
  devOnly={true}
  showHintBadge={true}
  hotkey={{ ctrlOrMeta: true, shift: true, key: 'l' }}
  zIndex={3000}
  maxTextLength={120}
  onInspect={(snapshot) => console.log(snapshot)}
/>
```

### Props

- `enabled?: boolean` enable overlay (default `true`)
- `devOnly?: boolean` run only in dev mode (default `true`)
- `showHintBadge?: boolean` show bottom-right hint when idle (default `true`)
- `hotkey?: { ctrlOrMeta?: boolean; shift?: boolean; alt?: boolean; key?: string }`
- `zIndex?: number` overlay z-index (default `3000`)
- `maxTextLength?: number` max text preview length (default `120`)
- `onInspect?: (snapshot) => void` callback when an element is inspected
- `sourceResolver?: (element) => SourceLocation | null` custom source resolver

### Snapshot Fields

- `elementTag`
- `selector`
- `textPreview`
- `componentName`
- `fileName`
- `lineNumber`
- `columnNumber`

## Source Location Notes

By default, the resolver reads React Fiber dev-only debug fields (`_debugSource`).

- Best source mapping in React development mode
- In production builds or missing debug info, it gracefully falls back to selector/component hints

## Local Development

```bash
npm install
npm run check
npm run build
```

## Publish

```bash
npm login --registry=https://registry.npmjs.org --scope=@coolwork-ai-labs --auth-type=legacy
npm publish
```

## GitHub Auto Publish (Recommended)

1. In GitHub repo settings, add `NPM_TOKEN` in `Settings -> Secrets and variables -> Actions`.
2. Push a version tag for each release (for example `v0.1.1`):

```bash
git tag v0.1.1
git push origin v0.1.1
```

3. The workflow at `/.github/workflows/npm-publish.yml` will build and publish to npm automatically.
