// Shared by the account reader and browser. A profile link is never a display name.
export function accountHandle(value, platform = 'instagram') {
  const input = String(value ?? '').trim();
  if (!input) return '';
  const valid = text => platform === 'instagram' ? /^[a-z0-9_.]{1,30}$/i.test(text) : /^[\p{L}\p{N}_.-]{1,100}$/u.test(text);
  const bare = input.replace(/^@/, '');
  if (!/[/:]/.test(input) && valid(bare)) return bare;
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : 'https://' + input);
    const hosts = {instagram:['instagram.com','www.instagram.com','m.instagram.com'],tiktok:['tiktok.com','www.tiktok.com'],youtube:['youtube.com','www.youtube.com','m.youtube.com']};
    if (!['http:','https:'].includes(url.protocol) || !hosts[platform]?.includes(url.hostname) || url.username || url.password) return '';
    const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (platform === 'youtube' && ['channel','c','user'].includes(parts[0]) && parts.length === 2) return valid(parts[1]) ? parts[1] : '';
    if (parts.length !== 1) return '';
    const handle = parts[0].replace(/^@/, '');
    if (platform === 'instagram' && ['p','reel','reels','stories','explore','accounts','direct'].includes(handle.toLowerCase())) return '';
    return valid(handle) ? handle : '';
  } catch { return ''; }
}

export function accountLabel(profile = {}) {
  const handle = accountHandle(profile.handle ?? profile.username, profile.platform ?? 'instagram');
  return handle ? '@' + handle : 'Your account';
}

export function accountAvatar(profile, esc, className = 'account-avatar') {
  // Only the workspace's validated local image projection can reach the browser.
  const url = typeof profile.avatar === 'string' && /^\/media\/context\/profile\/[^/?]+\.(?:png|jpe?g|webp)(?:\?v=[a-z0-9%.\-]+)?$/i.test(profile.avatar) ? profile.avatar : null;
  return url ? `<span class="${className} creator-avatar" aria-hidden="true"><img src="${esc(url)}" alt="" decoding="async" data-account-avatar></span>` : '';
}
