# Publishing Setup Instructions

## Prerequisites

1. **Create an npm account** at <https://www.npmjs.com> if you don't have one
2. **Generate an npm access token**:
   - Go to <https://www.npmjs.com/settings/tokens>
   - Click "Generate New Token" → "Automation"
   - Copy the generated token

## GitHub Setup

1. **Add npm token to GitHub secrets**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm access token from step 2 above

## Publishing Methods

### Method 1: GitHub Release (Recommended)

1. **Create a GitHub Release**:
   - Go to your GitHub repository
   - Click "Releases" → "Create a new release"
   - Create a new tag (e.g., `v0.1.1`, `v0.2.0`, `v1.0.0`)
   - Add release title and description
   - Click "Publish release"

2. **Automatic workflows will run**:
   - "Release" workflow updates package.json version
   - "Publish to NPM" workflow publishes to npm

### Method 2: Manual Publishing

1. Go to Actions tab in GitHub
2. Select "Publish to NPM" workflow  
3. Click "Run workflow" on the main branch

### Method 3: Local Publishing

```bash
# Build the package
bun run build

# Publish to npm (make sure you're logged in with npm login)
npm publish
```

## Version Management

- **Patch** (0.1.0 → 0.1.1): Bug fixes
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

## Package Contents

The published package will include:

- `dist/` - Compiled JavaScript and TypeScript declarations
- `package.json` - Package metadata
- `LICENSE` - MIT license
- `README.md` - Documentation

## Verification

After publishing, verify at:

- <https://www.npmjs.com/package/trpc-formdata>
- Test installation: `npm install trpc-formdata`
