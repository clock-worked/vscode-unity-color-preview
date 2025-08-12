## Contributing

Thanks for your interest in contributing! Please follow the steps below to get started.

### Prerequisites

- Node.js LTS (>= 18)
- npm 8+
- VS Code

### Setup

1. Clone the repository
2. Install dependencies: `npm ci`
3. Build: `npm run compile`
4. Launch the extension in a VS Code Extension Host: press F5 from this workspace

### Development

- Source lives in `src/` and compiles to `out/`
- Run TypeScript in watch mode with `npm run watch`

### Testing the Package

- Create a VSIX: `npm run package`
- Install the VSIX in VS Code (Extensions view → … menu → Install from VSIX)

### Publishing

Releases are automated via GitHub Actions. Push a tag like `v0.1.1` and the workflow will:

- Update `package.json` version to the tag value
- Build and publish to both the VS Code Marketplace and Open VSX

You must configure repository secrets:

- `VSCE_TOKEN` — Personal Access Token for the VS Code Marketplace
- `OPEN_VSX_TOKEN` — Personal Access Token for Open VSX

### Code Style

- Use TypeScript strict mode
- Prefer clear names and early returns


