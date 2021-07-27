export function onReady(cb: () => void): void {
  if (document.readyState !== 'loading') {
    setTimeout(cb, 0);
  } else {
    document.addEventListener('DOMContentLoaded', cb);
  }
}
