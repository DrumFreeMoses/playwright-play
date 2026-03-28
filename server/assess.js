const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function runAssessment(url, weights = { performance: 1, accessibility: 1, seo: 1 }) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(e => {
    console.warn('Navigation warning:', e.message || e);
  });

  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    return {
      domContentLoaded: nav.domContentLoadedEventEnd || (performance.timing && performance.timing.domContentLoadedEventEnd) || 0,
      loadEventEnd: nav.loadEventEnd || (performance.timing && performance.timing.loadEventEnd) || 0
    };
  });

  const imagesMissingAlt = await page.$$eval('img:not([alt])', imgs => imgs.length).catch(() => 0);
  const h1Count = await page.$$eval('h1', els => els.length).catch(() => 0);
  const metaDescription = await page.$eval('meta[name="description"]', el => el.getAttribute('content')).catch(() => null);
  const viewport = await page.$eval('meta[name="viewport"]', el => el.getAttribute('content')).catch(() => null);

  let axeResults = null;
  try {
    const axePath = require.resolve('axe-core/axe.min.js');
    await page.addScriptTag({ path: axePath });
    axeResults = await page.evaluate(async () => await window.axe.run());
  } catch (e) {
    axeResults = { error: e.message || String(e) };
  }

  const links = await page.$$eval('a[href]', as => as.map(a => a.href)).catch(() => []);
  let brokenLinks = [];
  if (typeof fetch !== 'undefined') {
    const checks = await Promise.all(links.slice(0, 50).map(async (link) => {
      try {
        const r = await fetch(link, { method: 'HEAD' });
        if (!r.ok) return { url: link, status: r.status };
        return null;
      } catch (e) {
        return { url: link, error: String(e) };
      }
    }));
    brokenLinks = checks.filter(Boolean);
  } else {
    brokenLinks = [{ notice: 'Link check skipped: global fetch unavailable' }];
  }

  await browser.close();

  const perfScore = computePerformanceScore(perf);
  const a11yScore = computeA11yScore(axeResults);
  const seoScore = computeSeoScore({ h1Count, metaDescription, viewport });

  const totalWeight = (weights.performance || 1) + (weights.accessibility || 1) + (weights.seo || 1);
  const overallScore = Math.round(((perfScore * (weights.performance || 1)) + (a11yScore * (weights.accessibility || 1)) + (seoScore * (weights.seo || 1))) / totalWeight);

  const report = {
    meta: { url, timestamp: new Date().toISOString() },
    execSummary: { overallScore, scores: { performance: perfScore, accessibility: a11yScore, seo: seoScore } },
    details: { performance: perf, imagesMissingAlt, h1Count, metaDescription, viewport, axeResults, brokenLinks: brokenLinks.slice(0, 100) },
    recommendations: generateRecommendations({ perfScore, a11yScore, seoScore, details: { imagesMissingAlt, h1Count, metaDescription, viewport, brokenLinks } })
  };

  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const base = `${Date.now()}-${sanitizeFilename(url)}`;
  // expose generated filenames so clients can fetch the summary/html/json directly
  report.meta = report.meta || {};
  report.meta.reportBase = base;
  report.meta.jsonFile = `${base}.json`;
  report.meta.htmlFile = `${base}.html`;
  report.meta.summaryFile = `${base}.summary.html`;

  fs.writeFileSync(path.join(reportsDir, report.meta.jsonFile), JSON.stringify(report, null, 2));

  // Write human-readable HTML summary report
  const summaryHtml = `<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\">
  <title>Assessment Summary Report</title>
  <style>body{font-family:sans-serif;max-width:700px;margin:2em auto;padding:2em;border:1px solid #ccc;border-radius:8px;}h1{font-size:1.5em;}ul{margin:0 0 1em 1.5em;}li{margin-bottom:0.5em;}</style>
</head>
<body>
  <h1>Assessment Summary Report</h1>
  <p><strong>For:</strong> <a href=\"${url}\" target=\"_blank\" rel=\"noopener\">${url}</a></p>
  <p><strong>Timestamp:</strong> ${report.meta.timestamp}</p>
  <h2>Scores</h2>
  <ul>
    <li><strong>Overall:</strong> ${report.execSummary.overallScore}</li>
    <li><strong>Performance:</strong> ${report.execSummary.scores.performance}</li>
    <li><strong>Accessibility:</strong> ${report.execSummary.scores.accessibility}</li>
    <li><strong>SEO:</strong> ${report.execSummary.scores.seo}</li>
  </ul>
  <h2>Key Findings</h2>
  <ul>
    <li>Images missing alt: ${report.details.imagesMissingAlt}</li>
    <li>H1 count: ${report.details.h1Count}</li>
    <li>Meta description present: ${!!report.details.metaDescription}</li>
    <li>Viewport meta tag present: ${!!report.details.viewport}</li>
    <li>Broken links (first 100): ${report.details.brokenLinks.length}</li>
    <li>Accessibility violations: ${report.details.axeResults.violations ? report.details.axeResults.violations.length : 'N/A'}</li>
  </ul>
  <h2>Recommendations</h2>
  <ul>
    ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
  </ul>
  <p>For full details, see the <a href=\"${base}.json\">JSON report</a>.</p>
</body>
</html>`;
  fs.writeFileSync(path.join(reportsDir, `${base}.summary.html`), summaryHtml);

  const html = renderReportHtml(report);
  fs.writeFileSync(path.join(reportsDir, `${base}.html`), html);

  return report;
}

function computePerformanceScore(perf) {
  const load = perf.loadEventEnd || 0;
  if (!load) return 50;
  if (load < 1000) return 95;
  if (load < 3000) return 80;
  if (load < 6000) return 60;
  return 40;
}

function computeA11yScore(axeResults) {
  if (!axeResults) return 50;
  if (axeResults.error) return 60;
  const violations = axeResults.violations ? axeResults.violations.length : 0;
  if (violations === 0) return 95;
  if (violations < 5) return 75;
  if (violations < 15) return 50;
  return 30;
}

function computeSeoScore({ h1Count, metaDescription, viewport }) {
  let score = 100;
  if (!metaDescription) score -= 30;
  if (h1Count === 0) score -= 30;
  if (!viewport) score -= 20;
  return Math.max(20, score);
}

function generateRecommendations({ perfScore, a11yScore, seoScore, details }) {
  const recs = [];
  if (perfScore < 80) recs.push('Optimize large resources, enable compression and caching, and review above-the-fold rendering.');
  if (a11yScore < 80) recs.push('Address accessibility violations reported by axe-core; focus on images, labels, and ARIA roles.');
  if (seoScore < 80) recs.push('Add meta description, ensure a single H1, and include responsive viewport meta tag.');
  if (details.imagesMissingAlt && details.imagesMissingAlt > 0) recs.push(`Add alt attributes to ${details.imagesMissingAlt} images.`);
  if (details.brokenLinks && details.brokenLinks.length) recs.push(`Fix or remove ${details.brokenLinks.length} broken links (first 50 checked).`);
  recs.push('Consider running a full Lighthouse audit for deeper performance and SEO insights.');
  return recs;
}

function renderReportHtml(report) {
  const template = fs.readFileSync(path.join(__dirname, 'reportTemplate.html'), 'utf8');
  return template.replace('__REPORT_JSON__', JSON.stringify(report).replace(/</g, '\\u003c'));
}

function sanitizeFilename(url) {
  try {
    const u = new URL(url);
    const proto = u.protocol ? u.protocol.replace(':', '') : '';
    const pathPart = u.pathname ? u.pathname.replace(/\//g, '_') : '';
    const name = `${proto}_${u.hostname}${pathPart}`;
    return name.replace(/[^a-z0-9._-]/gi, '_').slice(0, 200);
  } catch (e) {
    return String(url).replace(/[\/\\:]/g, '_').replace(/[^a-z0-9._-]/gi, '_').slice(0, 200);
  }
}

if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node assess.js <url>');
    process.exit(2);
  }
  runAssessment(url).then(r => console.log(JSON.stringify(r, null, 2))).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { runAssessment };