export function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function clock(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function duration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function signalBars(rssi?: number) {
  if (rssi == null) return '';
  return rssi > -55 ? 'Strong' : rssi > -70 ? 'Good' : 'Weak';
}

export const transportLabel = (t?: string | null) =>
  ({ ble: 'Bluetooth', wifi_direct: 'Wi-Fi Direct', internet: 'Internet', nostr: 'Nostr', reticulum: 'Reticulum' })[
    (t ?? '').toLowerCase()
  ] ?? t ?? 'Unknown';
