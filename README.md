## Unity Color Preview

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/clock-worked.vscode-unity-color-preview)](https://marketplace.visualstudio.com/items?itemName=clock-worked.vscode-unity-color-preview)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/clock-worked.vscode-unity-color-preview)](https://marketplace.visualstudio.com/items?itemName=clock-worked.vscode-unity-color-preview)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/clock-worked.vscode-unity-color-preview)](https://marketplace.visualstudio.com/items?itemName=clock-worked.vscode-unity-color-preview)
[![Open VSX](https://img.shields.io/open-vsx/v/clock-worked/vscode-unity-color-preview)](https://open-vsx.org/extension/clock-worked/vscode-unity-color-preview)

Inline color previews for Unity's `Color` and `Color32` constructors in C#.

### Features

- **Inline color swatches** for occurrences of:
  - `new Color(r, g, b)` or `new Color(r, g, b, a)` where values are floats in \[0, 1\]
  - `new Color32(r, g, b)` or `new Color32(r, g, b, a)` where values are bytes in \[0, 255\]
- **Quick replace presentations** to switch between `Color` and `Color32` forms.

### Demo

Type code like this in a C# file:

```csharp
var tint = new UnityEngine.Color(0.75f, 0.25f, 0.5f, 0.8f);
var ui = new UnityEngine.Color32(128, 64, 255, 200);
```

You will see color decorations inline and can use the color picker to edit.

### Requirements

- VS Code ≥ 1.85.0

### Extension Settings

No settings at this time.

### Known Issues

- Does not parse variables or expressions, only direct constructor literals.

### Release Notes

See [`CHANGELOG.md`](./CHANGELOG.md).

### Contributing

Contributions welcome! See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

### License

MIT © Clockworked — see [`LICENSE`](./LICENSE)


