All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [1.2.0] - 2025-01-27
- Added configurable color highlighting with background or underline styles
- Added support for named Unity colors (Color.red, Color.white, Color.clear, etc.)
- Added comprehensive configuration options:
  - `unityColorPreview.showHighlightColor`: Enable/disable color highlighting
  - `unityColorPreview.highlightOpacity`: Control highlight transparency (0-1)
  - `unityColorPreview.highlightStyle`: Choose between 'background' or 'underline' highlighting
  - `unityColorPreview.showOverviewRulerColor`: Show color marks in overview ruler
  - `unityColorPreview.preferredFormat`: Set preferred Color vs Color32 format
  - `unityColorPreview.floatPrecision`: Control decimal precision (0-6)
  - `unityColorPreview.includeAlphaByDefault`: Order alpha variants first
  - `unityColorPreview.enableNamedColors`: Enable/disable named color detection
- Enhanced color presentation ordering based on user preferences
- Added real-time highlight updates when configuration changes
- Improved performance with grouped decorations for identical colors

## [1.1.0] - 2025-08-12
- Added demo GIF and extension icon
- Improved documentation and visual presentation

## [0.1.0] - 2025-08-12
- Initial release with inline previews for `Color` and `Color32` in C#.


