# Copilot instructions for MoSight (playwright-play)

Build, test, and lint commands
- Install dependencies: npm install
- Install Playwright browsers (required for tests): npx playwright install --with-deps
- Start demo server: npm start
- Start demo server and fallback to ephemeral port if 3000 is busy: FALLBACK_TO_EPHEMERAL=1 npm start
- Start demo server (explicit): npm run serve
- Kill process using a port (macOS/Linux): npm run kill-port -- 3000
- Run full Playwright test suite: npm test
- Run a single test file: npx playwright test tests/mosight.spec.ts
- Run tests by title (grep): npx playwright test -g "UI runs assessment"
- CLI assessment (no server): node server/assess.js https://example.com
- Suggest selectors (AI-assist): node scripts/suggest-selectors.js https://example.com

High-level architecture
- server/ — Express API and assessment engine (server/assess.js)
- public/ — Minimal frontend (index.html + app.js) with sliders and report renderer
- tests/ — Playwright tests (BDD-style) and Page Object Model under tests/pageObjects/
- scripts/ — Small AI helpers (selector suggestions)
- server/reports/ — Generated JSON/HTML reports per run
- .github/workflows/playwright.yml — CI workflow that runs Playwright tests

Key conventions
- Tests are authored with descriptive, BDD-style titles; prefer tests/*.spec.ts
- Page objects live in tests/pageObjects and expose high-level actions (goto, run, getReport)
- Prefer stable selectors: data-testid, id, aria-label, role; scripts/suggest-selectors.js scans pages and proposes candidates
- Reports: each assessment writes <timestamp>-<sanitized-url>.json and .html to server/reports/
- Assessment API: POST /api/assess { url, weights: { performance, accessibility, seo } } — returns full report JSON
- Keep logic DAMP/DRY: avoid duplicating scoring heuristics; adjust in server/assess.js

AI-integration notes
- scripts/suggest-selectors.js demonstrates lightweight “AI-like” heuristics for selector recommendation (no external API required).
- The assessment engine injects axe-core (if installed) to collect accessibility issues; enable via dependencies.

CI / MCP servers
- A Playwright GitHub Action workflow is included at .github/workflows/playwright.yml (runs on push/pull_request).
- To add BrowserStack / Sauce Labs or other MCP servers, update the workflow or ask for configuration.

If you need changes to these instructions (more CI, alternate report formats, or test coverage areas), tell me which and they'll be added.
