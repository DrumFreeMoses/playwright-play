document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = document.getElementById('url').value;
  const root = document.getElementById('report');
  root.innerHTML = '<p>Running assessment…</p>';
  try {
    const res = await fetch('/api/assess', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const report = await res.json();
    // Attempt to load HTML summary if server provided one
    try {
      if (report.meta && report.meta.summaryFile) {
        const summaryRes = await fetch(`/reports/${report.meta.summaryFile}`);
        if (summaryRes.ok) {
          const summaryHtml = await summaryRes.text();
          root.innerHTML = summaryHtml + `<p style='margin-top:1em;'>Raw JSON: <a href="/reports/${report.meta.jsonFile}" target="_blank">Download</a></p>`;
          return;
        }
      }
    } catch (e) {}
    root.innerHTML = `<pre>${JSON.stringify(report, null, 2)}</pre>`;
  } catch (err) {
    root.innerHTML = `<pre>Error: ${err.message || err}</pre>`;
  }
});