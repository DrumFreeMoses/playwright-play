# MoSight — Playwright demo

MoSight is a small demo application that performs quick website quality assessments using Playwright and lightweight open-source tools. It demonstrates BDD-style test design, Page Object Model, AI-assisted selector suggestions, and a minimal server/frontend that runs assessments and generates per-run reports.

Quick start
1. Install dependencies: npm install
2. Install Playwright browsers: npx playwright install --with-deps
3. Start the demo server: npm start
4. Open http://localhost:3000 and run an assessment
5. Run tests: npm test
6. Run a single test file: npm run test:single

Report output
- JSON and HTML reports are saved to server/reports/

Port conflicts
- If port 3000 is in use: start the server on a different port with PORT=4000 npm start.
- To automatically fall back to an ephemeral port when 3000 is busy: FALLBACK_TO_EPHEMERAL=1 npm start
- To diagnose which process is listening: npm run diagnose-port -- 3000
- To kill the process using a port (macOS/Linux): npm run kill-port -- 3000

Tests
- The Playwright tests start a programmatic server on an ephemeral port for isolation. Run tests with: npm test

Contact
- Moses — Thank you for reviewing MoSight.
