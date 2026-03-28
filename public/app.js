document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = document.getElementById('url').value;
  const performance = Number(document.getElementById('weight-performance').value);
  const accessibility = Number(document.getElementById('weight-accessibility').value);
  const seo = Number(document.getElementById('weight-seo').value);
  const root = document.getElementById('report');
  root.innerHTML = '<p>Running assessment…</p>';
  try {
    const res = await fetch('/api/assess', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, weights: { performance, accessibility, seo } })
    });
    const report = await res.json();
    // If server provided filenames, prefer loading the summary HTML
    try {
      if (report.meta && report.meta.summaryFile) {
        const summaryRes = await fetch(`/reports/${report.meta.summaryFile}`);
        if (summaryRes.ok) {
          const summaryHtml = await summaryRes.text();
          root.innerHTML = summaryHtml + `<p style='margin-top:1em;'>Raw JSON: <a href="/reports/${report.meta.jsonFile}" target="_blank">Download</a></p>`;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load summary HTML:', e);
    }
    // fallback to JSON rendering
    renderReport(report);
  } catch (err) {
    root.innerHTML = `<pre>Error: ${err.message || err}</pre>`;
  }
});

function renderReport(report) {
  const root = document.getElementById('report');
  if (!root) return;
  root.innerHTML = `
    <section class="section-execSummary">
      <h2>Executive Summary</h2>
      <p class="overall-score">Overall Score: ${report.execSummary.overallScore}</p>
      <pre>${JSON.stringify(report.execSummary, null, 2)}</pre>
    </section>
    <section class="section-details">
      <h3>Details</h3>
      <pre>${JSON.stringify(report.details, null, 2)}</pre>
    </section>
    <section class="section-recommendations">
      <h3>Recommendations</h3>
      <pre>${JSON.stringify(report.recommendations, null, 2)}</pre>
    </section>
  `;
}
