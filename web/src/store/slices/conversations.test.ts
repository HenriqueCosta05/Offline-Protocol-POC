import type { ChatMessage } from '@/@types/chat';
import reducer, {
  messageQueued,
  messageReceived,
  selectOutbox,
  statusUpdated,
} from './conversations';

const msg = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm1',
  peerId: 'bob',
  direction: 'out',
  content: 'hi',
  ts: 1,
  status: 'pending',
  ...over,
});

const empty = { byPeer: {} };

describe('conversations', () => {
  it('dedupes received messages by id', () => {
    const incoming = msg({ direction: 'in', status: 'delivered' });
    const state = reducer(reducer(empty, messageReceived(incoming)), messageReceived(incoming));
    expect(state.byPeer.bob).toHaveLength(1);
  });

  it('does not downgrade a delivered message', () => {
    let state = reducer(empty, messageQueued(msg()));
    state = reducer(state, statusUpdated({ id: 'm1', status: 'delivered' }));
    state = reducer(state, statusUpdated({ id: 'm1', status: 'sent' }));
    expect(state.byPeer.bob?.[0]?.status).toBe('delivered');
  });

  it('ignores status updates for unknown ids', () => {
    expect(reducer(empty, statusUpdated({ id: 'nope', status: 'failed' }))).toEqual(empty);
  });

  it('outbox holds only pending outgoing messages, oldest first', () => {
    let state = reducer(empty, messageQueued(msg({ id: 'b', ts: 2 })));
    state = reducer(state, messageQueued(msg({ id: 'a', ts: 1, peerId: 'amy' })));
    state = reducer(state, messageQueued(msg({ id: 'c', ts: 3, status: 'sent' })));
    state = reducer(state, messageReceived(msg({ id: 'd', direction: 'in', status: 'pending' })));
    expect(selectOutbox({ conversations: state }).map((m) => m.id)).toEqual(['a', 'b']);
  });
});
