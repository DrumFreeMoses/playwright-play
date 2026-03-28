const fs = require('fs');
const path = require('path');
const tplPath = path.join(__dirname, '..', 'server', 'reportTemplate.html');
const reportsDir = path.join(__dirname, '..', 'server', 'reports');

if (!fs.existsSync(tplPath)) {
  console.error('Template not found:', tplPath);
  process.exit(2);
}
const tpl = fs.readFileSync(tplPath, 'utf8');
const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));
if (!files.length) {
  console.log('No JSON reports found');
  process.exit(0);
}

files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(reportsDir, file), 'utf8'));
    const html = tpl.replace('__REPORT_JSON__', JSON.stringify(data).replace(/</g, '\\u003c'));
    const outFile = file.replace(/\.json$/, '.html');
    fs.writeFileSync(path.join(reportsDir, outFile), html, 'utf8');
    console.log('Rendered', outFile);
  } catch (e) {
    console.error('Failed to render', file, e.message || e);
  }
});
