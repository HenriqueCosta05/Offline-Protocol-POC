import { makeStore } from '@/store';
import { messageQueued } from '@/store/slices/conversations';
import { peerFound } from '@/store/slices/peers';
import { loadPersisted, persistStore } from './persist';

describe('persistence', () => {
  it('round-trips conversations and restores peers as offline', () => {
    const store = makeStore();
    persistStore(store);
    store.dispatch(peerFound({ id: 'bob', transport: 'ble' }));
    store.dispatch(
      messageQueued({ id: 'm1', peerId: 'bob', direction: 'out', content: 'hi', ts: 1, status: 'pending' }),
    );

    const restored = loadPersisted();
    expect(restored.conversations?.byPeer.bob?.[0]?.content).toBe('hi');
    expect(restored.peers?.bob?.online).toBe(false);
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('offline-messenger:v1', '{not json');
    expect(loadPersisted()).toEqual({});
  });
});
