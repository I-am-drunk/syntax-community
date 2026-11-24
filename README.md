# Syntax Community Hub

The official catalog and discovery website for the **Syntax** learning platform, hosted free on GitHub Pages at `https://i-am-drunk.github.io/syntax-community/`.

## Package Formats

Syntax uses three clear package formats:

- **`.syntaxcourse`**: Interactive courses with lessons, checks, and declared embedded plugin requirements.
- **`.syntaxplugin`**: Global app tools (such as Pen Studio, Video Walkthroughs, Checkmark Gate, or Focus Timer). Any plugin with `touchesCore: true` displays the mandatory warning: **"This plugin touches core."**
- **`.syntaxembeddedplugin`**: Shared interactive course libraries (such as Math Graph Engine, Grid Coding Engine, and Unit Circle Lab). Every embedded plugin includes an **AI Usage Card** so AI connectors (Claude, ChatGPT, MCP) can discover and reuse it instead of reinventing components.

## Submitting a Package

1. Add your package file inside `packages/<id><extension>`.
2. Add your metadata entry and SHA-256 checksum to `catalog/catalog.json`.
3. Run `node scripts/validate-catalog.mjs` locally to verify schema rules, SVG icon, safety scan, and checksums.
4. Open a Pull Request. Automated GitHub Actions checks validate every submission before merge.
