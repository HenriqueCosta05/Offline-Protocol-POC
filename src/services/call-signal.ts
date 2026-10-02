/**
 * The SDK has no real-time media API (only messages, files and voice notes), so calls are
 * signalled as control messages over the mesh. These ride the same encrypted channel as chat.
 */
const PREFIX = '@@call:';

export type CallSignal = { t: 'invite' | 'accept' | 'decline' | 'end'; id: string };

export const encodeSignal = (s: CallSignal) => PREFIX + JSON.stringify(s);

export function decodeSignal(content: string): CallSignal | null {
  if (!content.startsWith(PREFIX)) return null;
  try {
    const s = JSON.parse(content.slice(PREFIX.length));
    return typeof s?.id === 'string' && ['invite', 'accept', 'decline', 'end'].includes(s.t) ? s : null;
  } catch {
    return null;
  }
}
