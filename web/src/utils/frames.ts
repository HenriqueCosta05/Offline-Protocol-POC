import type { ServerFrame } from '@/@types/frames';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/** Validates an untrusted WebSocket payload; returns null for anything malformed. */
export function parseFrame(data: unknown): ServerFrame | null {
  let raw: unknown = data;
  if (typeof data === 'string') {
    try {
      raw = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (!isRecord(raw)) return null;

  switch (raw.type) {
    case 'identity':
      return isString(raw.address) ? { type: 'identity', address: raw.address } : null;
    case 'message_received':
      return isString(raw.id) &&
        isString(raw.from) &&
        typeof raw.content === 'string' &&
        typeof raw.ts === 'number'
        ? { type: 'message_received', id: raw.id, from: raw.from, content: raw.content, ts: raw.ts }
        : null;
    case 'neighbor_discovered':
      return isString(raw.id) && isString(raw.transport)
        ? {
            type: 'neighbor_discovered',
            id: raw.id,
            transport: raw.transport,
            ...(typeof raw.rssi === 'number' ? { rssi: raw.rssi } : {}),
          }
        : null;
    case 'neighbor_lost':
      return isString(raw.id) ? { type: 'neighbor_lost', id: raw.id } : null;
    case 'delivery_status':
      return isString(raw.id) && (raw.status === 'delivered' || raw.status === 'failed')
        ? { type: 'delivery_status', id: raw.id, status: raw.status }
        : null;
    case 'error':
      return isString(raw.code) && typeof raw.message === 'string'
        ? { type: 'error', code: raw.code, message: raw.message }
        : null;
    default:
      return null;
  }
}
