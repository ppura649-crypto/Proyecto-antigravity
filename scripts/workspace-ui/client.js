// One subscription for every screen. File refreshes never navigate or reset drafts.
export class WorkspaceClient {
  constructor({onData, onStatus, interval = 10000, fetcher = globalThis.fetch.bind(globalThis), source} = {}) {
    Object.assign(this, {onData, onStatus, interval, fetcher, source});
    this.refresh = this.refresh.bind(this);
    this.wake = () => { if (!document.hidden) this.refresh(); };
  }
  start() {
    this.stopped = false;
    window.addEventListener('focus', this.wake);
    window.addEventListener('online', this.wake);
    document.addEventListener('visibilitychange', this.wake);
    this.timer = setInterval(this.wake, this.interval);
    return this.refresh();
  }
  async refreshAfterWrite() {
    // A poll begun before a save must finish before reading the newly written state.
    await this.pending;
    return this.refresh();
  }
  async refresh() {
    if (this.pending || this.stopped) return this.pending;
    this.controller = new AbortController();
    this.pending = (async () => {
      const timeout = setTimeout(() => this.controller.abort(), 8000);
      try {
        let next;
        if (this.source) next = await Promise.resolve(this.source());
        else {
          const response = await this.fetcher('/api/workspace', {cache:'no-store', signal:this.controller.signal});
          if (!response.ok) throw new Error('Workspace unavailable');
          next = await response.json();
        }
        if (this.stopped) return;
        if (!next || !Array.isArray(next.formats) || !next.workspaceId) throw new Error('Workspace unavailable');
        const changed = !this.data || this.data.revision !== next.revision;
        this.data = next;
        this.onStatus?.('connected');
        if (changed) this.onData?.(next);
      } catch {
        if (!this.stopped) this.onStatus?.(this.data ? 'reconnecting' : 'unavailable');
      } finally { clearTimeout(timeout); this.pending = null; }
    })();
    return this.pending;
  }
  stop() {
    this.stopped = true;
    clearInterval(this.timer);
    this.controller?.abort();
    window.removeEventListener('focus', this.wake);
    window.removeEventListener('online', this.wake);
    document.removeEventListener('visibilitychange', this.wake);
  }
}
