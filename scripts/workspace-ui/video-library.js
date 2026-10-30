// One shelf for every finished video. Filters and page live in the URL so a recording can reopen the same view.
export function videoLibrary(snapshot, params, { esc, heading, link, outputCards, empty }) {
  const all = snapshot.outputs || [];
  const query = (params.get('q') || '').trim();
  const chosen = params.get('format') || '';
  const names = new Map((snapshot.formats || []).map(f => [f.id, f.name]));
  names.set('edit', 'Your edits');
  const formats = [...new Set(all.map(o => o.format).filter(Boolean))].sort();
  const outputs = all.filter(o => (!chosen || o.format === chosen) && (!query || [o.name, o.projectId, names.get(o.format)].join(' ').toLowerCase().includes(query.toLowerCase())));
  const pages = Math.max(1, Math.ceil(outputs.length / 24));
  const page = Math.max(1, Math.min(pages, Math.floor(Number(params.get('page')) || 1)));
  const pageUrl = next => { const q = new URLSearchParams(); if (query) q.set('q', query); if (chosen) q.set('format', chosen); q.set('page', String(next)); return '/videos?' + q; };
  const controls = `<form action="/videos" method="get" class="button-row" aria-label="Find videos"><label class="field"><span>Search</span><input type="search" name="q" value="${esc(query)}" placeholder="Find a video"></label><label class="field"><span>Format</span><select name="format"><option value="">All formats</option>${formats.map(id => `<option value="${esc(id)}" ${id === chosen ? 'selected' : ''}>${esc(names.get(id) || id)}</option>`).join('')}</select></label><button class="btn" type="submit">Find</button>${query || chosen ? link('Clear', '/videos', 'ghost') : ''}</form>`;
  return heading('Your videos', `${outputs.length} video${outputs.length === 1 ? '' : 's'}${query || chosen ? ' found' : ', saved on your computer'}.`, link('New video', '/new', 'primary', 'plus')) + controls +
    (outputs.length ? `<section class="recent-outputs">${outputCards(outputs.slice((page - 1) * 24, page * 24))}</section>` : empty(all.length ? 'No matching videos' : 'Your first video starts here', all.length ? 'Try another name or format.' : 'Finished videos from every format appear here.')) +
    (pages > 1 ? `<nav class="button-row" aria-label="Video pages">${page > 1 ? link('Previous', pageUrl(page - 1)) : ''}<span class="tiny">Page ${page} of ${pages}</span>${page < pages ? link('Next', pageUrl(page + 1)) : ''}</nav>` : '');
}
