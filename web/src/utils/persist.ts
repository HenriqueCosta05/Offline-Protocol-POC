import type { ChatMessage, Peer } from '@/@types/chat';
import type { AppStore, RootState } from '@/store';

const KEY = 'offline-messenger:v1';

type Persisted = Pick<RootState, 'conversations' | 'peers'>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Reads saved chats; storage can be blocked or corrupt, so any failure yields no state. */
export function loadPersisted(): Partial<Persisted> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!isRecord(parsed)) return {};
    const result: Partial<Persisted> = {};
    if (isRecord(parsed.conversations) && isRecord(parsed.conversations.byPeer)) {
      result.conversations = {
        byPeer: parsed.conversations.byPeer as Record<string, ChatMessage[]>,
      };
    }
    if (isRecord(parsed.peers)) {
      // Presence is live data: restored peers start offline until the bridge reports them.
      result.peers = Object.fromEntries(
        Object.entries(parsed.peers as Record<string, Peer>).map(([id, peer]) => [
          id,
          { ...peer, online: false },
        ]),
      );
    }
    return result;
  } catch {
    return {};
  }
}

export function persistStore(store: AppStore): () => void {
  let last: Persisted | null = null;
  return store.subscribe(() => {
    const { conversations, peers } = store.getState();
    if (last && last.conversations === conversations && last.peers === peers) return;
    last = { conversations, peers };
    try {
      localStorage.setItem(KEY, JSON.stringify(last));
    } catch {
      /* storage full or unavailable: keep working in memory */
    }
  });
}
