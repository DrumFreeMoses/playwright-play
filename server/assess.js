const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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

async function runAssessment(url, weights = { performance: 1, accessibility: 1, seo: 1 }) {
  // Simple HTML fetch-based assessment (lightweight demo)
  let body = '';
  try {
    const r = await fetch(url);
    body = await r.text();
  } catch (e) {
    body = '';
  }

  const imagesMissingAlt = (body.match(/<img(?![^>]*alt=)/gi) || []).length;
  const h1Count = (body.match(/<h1/gi) || []).length;
  const metaDescription = (body.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || [])[1] || null;
  const viewport = !!body.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);

  const perfScore = 80;
  const a11yScore = imagesMissingAlt === 0 ? 95 : 50;
  const seoScore = (metaDescription ? 90 : 60) - (h1Count === 0 ? 30 : 0);
  const totalWeight = (weights.performance || 1) + (weights.accessibility || 1) + (weights.seo || 1);
  const overallScore = Math.round(((perfScore * (weights.performance || 1)) + (a11yScore * (weights.accessibility || 1)) + (seoScore * (weights.seo || 1))) / totalWeight);

  const report = {
    meta: { url, timestamp: new Date().toISOString() },
    execSummary: { overallScore, scores: { performance: perfScore, accessibility: a11yScore, seo: seoScore } },
    details: { performance: {}, imagesMissingAlt, h1Count, metaDescription, viewport, axeResults: {}, brokenLinks: [] },
    recommendations: []
  };

  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const base = `${Date.now()}-${sanitizeFilename(url)}`;
  report.meta.reportBase = base;
  report.meta.jsonFile = `${base}.json`;
  report.meta.summaryFile = `${base}.summary.html`;
  report.meta.htmlFile = `${base}.html`;

  // simple recommendations
  if (imagesMissingAlt > 0) report.recommendations.push(`Add alt attributes to ${imagesMissingAlt} images.`);
  if (!metaDescription) report.recommendations.push('Add a meta description.');
  if (h1Count !== 1) report.recommendations.push('Ensure a single H1 per page.');

  fs.writeFileSync(path.join(reportsDir, report.meta.jsonFile), JSON.stringify(report, null, 2));

  const summaryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Assessment Summary Report</title>
</head>
<body>
  <h1>Assessment Summary Report</h1>
  <p><strong>For:</strong> <a href="${url}">${url}</a></p>
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
  </ul>
  <h2>Recommendations</h2>
  <ul>
    ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
  </ul>
  <p>For full details, see the <a href="${report.meta.jsonFile}">JSON report</a>.</p>
</body>
</html>`;

  fs.writeFileSync(path.join(reportsDir, report.meta.summaryFile), summaryHtml);
  fs.writeFileSync(path.join(reportsDir, report.meta.htmlFile), `<html><body><pre>${JSON.stringify(report, null, 2)}</pre></body></html>`);

  return report;
}

module.exports = { runAssessment };
