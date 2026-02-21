# ui-locator-overlay

开发态 UI 定位器：按快捷键进入拾取模式，点击页面元素即可拿到组件名、源码路径、行列号、DOM 选择器与文本预览。

适用场景：Tauri/WebView、Vite、React 管理后台等（不依赖浏览器扩展）。

## 文档导航

- [中文说明（当前）](https://github.com/coolwork-ai-labs/ui-locator-overlay/blob/main/README.md)
- [English README](https://github.com/coolwork-ai-labs/ui-locator-overlay/blob/main/README_EN.md)
- [GitHub Repository](https://github.com/coolwork-ai-labs/ui-locator-overlay)
- [Issues](https://github.com/coolwork-ai-labs/ui-locator-overlay/issues)

## 安装

```bash
npm i @coolwork-ai-labs/ui-locator-overlay
```

## 快速开始（React）

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

## 默认交互

- `Ctrl + Shift + L`: 开启/关闭定位模式（macOS 支持 `Command + Shift + L`）
- 点击页面元素：显示定位信息
- `Esc`: 退出定位模式
- 面板支持一键复制定位信息

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

- `enabled?: boolean` 是否启用（默认 `true`）
- `devOnly?: boolean` 仅开发环境启用（默认 `true`）
- `showHintBadge?: boolean` 非激活态显示右下角提示（默认 `true`）
- `hotkey?: { ctrlOrMeta?: boolean; shift?: boolean; alt?: boolean; key?: string }` 快捷键配置
- `zIndex?: number` 覆盖层层级（默认 `3000`）
- `maxTextLength?: number` 文本预览最大长度（默认 `120`）
- `onInspect?: (snapshot) => void` 点击定位回调
- `sourceResolver?: (element) => SourceLocation | null` 自定义源码解析器

### Snapshot 字段

- `elementTag`
- `selector`
- `textPreview`
- `componentName`
- `fileName`
- `lineNumber`
- `columnNumber`

## 关于源码定位

默认实现使用 React Fiber 的开发态调试字段（`_debugSource`）。

- 在 React 开发模式下可获得较好的 `file:line:column`
- 生产构建或调试字段不可用时，会自动回退（仍可得到选择器与组件名）

## 本地开发

```bash
npm install
npm run check
npm run build
```

## 发布

```bash
npm login --registry=https://registry.npmjs.org --scope=@coolwork-ai-labs --auth-type=legacy
npm publish
```

## GitHub 自动发布（推荐）

1. 在 GitHub 仓库里配置 `Settings -> Secrets and variables -> Actions`，新增 `NPM_TOKEN`（npm automation token）。
2. 每次发版时推送一个版本 tag（例如 `v0.1.1`）：

```bash
git tag v0.1.1
git push origin v0.1.1
```

3. 仓库内置工作流 `/.github/workflows/npm-publish.yml` 会自动构建并发布到 npm。
