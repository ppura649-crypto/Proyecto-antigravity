// A shareable reading: authored content, cited claims and honest visual scales.
// Sources are agent readings, never a claim that an HTTP response verified the text.
const array = x => Array.isArray(x) ? x : [];
export const documentEscape = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const documentURL = value => {try {const u = new URL(value);return ['https:','http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null;} catch {return null;}};
export function documentProblems(doc, {now = Date.now(), fresh = true} = {}) {
 const problems = [], sources = array(doc?.sources), blocks = array(doc?.blocks), ids = sources.map(s => s?.id);
 const prose = [];
 const checkText = (s, label) => {if (typeof s !== 'string' || !s.trim()) problems.push(`${label} is missing.`);else prose.push(s);};
 if (doc?.author) checkText(doc.author,'Author');if (doc?.kind) checkText(doc.kind,'Document kind');
 checkText(doc?.title, 'Document title');checkText(doc?.summary, 'Opening');
 if (!blocks.length) problems.push('Write the document before building it.');
 if (!sources.length || new Set(ids).size !== ids.length) problems.push('Give the document unique source references.');
 for (const source of sources) {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(source?.id || '') || !documentURL(source?.url)) problems.push('A source link is missing or unsafe.');
  checkText(source?.title,'Source title');checkText(source?.finding,'Source reading');
  const at = Date.parse(source?.checkedAt);
  if (!Number.isFinite(at) || at > now + 60000 || fresh && now - at > 86400000) problems.push('Read each source today before delivering it.');
 }
 const cite = b => {const refs = array(b.sources);if (!refs.length || refs.some(id => !ids.includes(id))) problems.push('Link every section to the sources supporting it.');};
 let visual = false;
 for (const block of blocks) {
  if (!['text','steps','flow','comparison','chart','image','callout'].includes(block?.type)) {problems.push('Choose a supported document section.');continue;}
  checkText(block.title, 'Section title');cite(block);
  if (['text','callout'].includes(block.type)) {if (!array(block.paragraphs).length) problems.push('A section has no explanation.');for (const p of array(block.paragraphs)) checkText(p,'Paragraph');}
  if (['steps','flow'].includes(block.type)) {visual = true;if (!array(block.items).length) problems.push('Add the actual steps.');for (const i of array(block.items)) {checkText(i.title,'Step title');checkText(i.text,'Step explanation');}}
  if (block.type === 'comparison') {visual = true;if (array(block.columns).length < 2 || !array(block.rows).length) problems.push('Add the comparison and its column labels.');for (const c of array(block.columns)) checkText(c,'Column');for (const row of array(block.rows)) {if (!Array.isArray(row) || row.length !== block.columns.length) problems.push('Every comparison row must match the column labels.');for (const cell of array(row)) checkText(cell,'Comparison value');}}
  if (block.type === 'chart') {visual = true;checkText(block.unit,'Chart unit');checkText(block.note,'Chart context');for(const d of array(block.data))if(d?.label)checkText(d.label,'Chart label');const data = array(block.data);if (!data.length || data.some(d => typeof d.label !== 'string' || !d.label.trim() || !Number.isFinite(d.value) || d.value < 0)) problems.push('Charts need labeled, nonnegative measured values.');if (block.baseline !== 0) problems.push('Bar charts must begin at zero.');}
  if (block.type === 'image') {visual = true;checkText(block.alt,'Image description');checkText(block.caption,'Image caption');checkText(block.credit,'Image credit');if (!/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(block.data || '')) problems.push('Embed an owned or permitted image in the document.');}
 }
 if (!visual) problems.push('Add a useful visual: steps, a comparison, chart or image.');
 if (prose.some(t => /[\u2013\u2014]/.test(t))) problems.push('Replace long dashes with clear sentences.');
 return [...new Set(problems)];
}
export const oneShotDocumentCSS = `
body:has(>.osd){background:#fff;color-scheme:light}.osd{max-width:1000px;margin:0 auto;padding:64px 56px 72px;color:#202327;background:#fff;font:17px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.osd *{box-sizing:border-box}.osd h1{font-size:48px;line-height:1.08;letter-spacing:-.03em;max-width:18ch;margin:16px 0 24px;text-wrap:balance}.osd h2{font-size:27px;line-height:1.25;letter-spacing:-.02em;margin:0 0 20px}.osd h3{font-size:18px;line-height:1.3;margin:0 0 6px}.osd p{max-width:68ch;margin:0 0 16px;text-wrap:pretty}.osd a{color:#ab3024;text-underline-offset:3px;overflow-wrap:anywhere}.osd-meta{font-size:14px;color:#5c626b}.osd-intro{font-size:21px;color:#4b525b;max-width:56ch;margin-bottom:40px!important}.osd section{margin-top:48px;break-inside:avoid-page}.osd-cites{font-size:13px;color:#5c626b;margin-top:14px}.osd-steps{padding:0;list-style:none;counter-reset:step}.osd-steps li{counter-increment:step;display:grid;grid-template-columns:36px 1fr;gap:16px;padding:20px 0;border-top:1px solid #dce0e4}.osd-steps li:before{content:counter(step);font-size:24px;font-weight:700;color:#ab3024}.osd-flow{display:flex;padding:0;list-style:none;gap:28px;margin:24px 0}.osd-flow li{flex:1;position:relative;padding:20px;background:#f0f2f4;border-radius:8px}.osd-flow li+li:before{content:"→";position:absolute;left:-24px;top:38%;font-size:20px;color:#ab3024}.osd-flow p{font-size:14px;margin:0}.osd-table{overflow:auto}.osd table{background:#fff;border-collapse:collapse;width:100%;font-size:15px}.osd th,.osd td{text-align:left;vertical-align:top;padding:14px;border-bottom:1px solid #dce0e4}.osd th{background:#f0f2f4;line-height:1.5;text-transform:none;letter-spacing:0;color:#202327}.osd th{font-family:inherit;font-size:15px;font-weight:650}.osd-callout{background:#f0f2f4;padding:26px;border-radius:10px}.osd figure{margin:0}.osd img{max-width:100%;height:auto;border-radius:8px}.osd figcaption{font-size:13px;color:#5c626b;margin-top:12px}.osd-bar{display:grid;grid-template-columns:minmax(90px,1fr) 3fr;gap:20px;align-items:center;margin:18px 0}.osd-bar-track{display:flex;gap:12px;align-items:center}.osd-bar-fill{height:28px;background:#b73729;min-width:0}.osd-bar-value{white-space:nowrap;font-size:14px}.osd-sources{border-top:1px solid #dce0e4;padding-top:32px;font-size:14px}.osd-sources li{margin-bottom:16px}.osd-sources p{margin:4px 0}.osd-print{float:right;appearance:none;border:1px solid #bfc6ce;background:#fff;padding:8px 14px;border-radius:6px;color:#202327;cursor:pointer;font:inherit;font-size:14px}@media(max-width:650px){.osd-flow{flex-direction:column;gap:24px}.osd-flow li+li:before{content:"↓";top:-27px;left:50%}.osd{padding:30px 20px}.osd h1{font-size:36px}.osd h2{font-size:24px}.osd-intro{font-size:19px}.osd section{margin-top:36px}.osd-bar{grid-template-columns:1fr;gap:6px}}@page{size:A4;margin:15mm}@media print{.osd{padding:0;font-size:11pt;max-width:none}.osd h1{font-size:32pt}.osd h2{font-size:20pt}.osd-intro{font-size:14pt}.osd-print{display:none}.osd section{margin-top:22pt}.osd-table{overflow:visible}.osd a{color:inherit}.osd th,.osd-callout,.osd-bar-fill{print-color-adjust:exact;-webkit-print-color-adjust:exact}.osd h2,.osd h3{break-after:avoid}.osd p{orphans:3;widows:3}}`;
export function documentBody(doc) {
 const e = documentEscape, citations = b => `<div class="osd-cites">Sources: ${b.sources.map(id => `<a href="#source-${e(id)}">${e(doc.sources.find(s => s.id === id).title)}</a>`).join(' · ')}</div>`;
 return `<article class="osd"><button class="osd-print" onclick="window.print()">Save as PDF</button><div class="osd-meta">${e(doc.author || '')}${doc.author ? ' · ' : ''}${e(doc.kind || 'Guide')}</div><h1>${e(doc.title)}</h1><p class="osd-intro">${e(doc.summary)}</p>${doc.blocks.map(b => {
 let body = '';
 if (['text','callout'].includes(b.type)) body = b.paragraphs.map(p => `<p>${e(p)}</p>`).join('');
 if (b.type === 'flow') body = `<ol class="osd-flow">${b.items.map(i => `<li><h3>${e(i.title)}</h3><p>${e(i.text)}</p></li>`).join('')}</ol>`;
 if (b.type === 'steps') body = `<ol class="osd-steps">${b.items.map(i => `<li><div><h3>${e(i.title)}</h3><p>${e(i.text)}</p></div></li>`).join('')}</ol>`;
 if (b.type === 'comparison') body = `<div class="osd-table"><table><thead><tr>${b.columns.map(c => `<th scope="col">${e(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(row => `<tr>${row.map((c,i) => i ? `<td>${e(c)}</td>` : `<th scope="row">${e(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 if (b.type === 'chart') {const max = Math.max(...b.data.map(d => d.value),1);body = `<figure aria-label="${e(b.title)}">${b.data.map(d => `<div class="osd-bar"><span>${e(d.label)}</span><div class="osd-bar-track"><div class="osd-bar-fill" style="width:${(d.value/max*75).toFixed(3)}%"></div><span class="osd-bar-value">${e(d.value)} ${e(b.unit)}</span></div></div>`).join('')}<figcaption>${e(b.note)} Scale begins at 0.</figcaption></figure>`;}
 if (b.type === 'image') body = `<figure><img src="${e(b.data)}" alt="${e(b.alt)}"><figcaption>${e(b.caption)} ${e(b.credit)}</figcaption></figure>`;
 return `<section${b.type === 'callout' ? ' class="osd-callout"' : ''}><h2>${e(b.title)}</h2>${body}${citations(b)}</section>`;
 }).join('')}<section class="osd-sources"><h2>Sources and further reading</h2><ol>${doc.sources.map(s => `<li id="source-${e(s.id)}"><a href="${e(documentURL(s.url))}">${e(s.title)}</a><p>${e(s.finding)}</p><span>Checked ${e(s.checkedAt.slice(0,10))}</span></li>`).join('')}</ol></section></article>`;
}
