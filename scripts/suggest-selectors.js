const { chromium } = require('playwright');
const url = process.argv[2];
if (!url) { console.error('Usage: node scripts/suggest-selectors.js <url>'); process.exit(1); }
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const suggestions = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('a,button,input,textarea,select,[data-testid],img,form'));
    return nodes.slice(0, 200).map(n => {
      const attrs = [...n.attributes].map(a => a.name);
      const preferred = attrs.find(a => ['data-testid','id','aria-label','role','name','alt','title'].includes(a));
      const selector = preferred ? `${n.tagName.toLowerCase()}[${preferred}="${n.getAttribute(preferred)}"]` : (() => {
        if (n.id) return `#${n.id}`;
        const classes = n.className ? '.' + n.className.trim().split(/\s+/).join('.') : '';
        return `${n.tagName.toLowerCase()}${classes}`;
      })();
      return { outerHTML: n.outerHTML.slice(0,200), selector, preferredAttr: preferred };
    });
  });
  console.log(JSON.stringify({ url, suggestions }, null, 2));
  await browser.close();
})();
