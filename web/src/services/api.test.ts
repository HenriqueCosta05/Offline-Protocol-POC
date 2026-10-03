import { ws } from 'msw';
import { server } from '@/mocks/server';
import { makeStore } from '@/store';
import { connectionChanged } from '@/store/slices/connection';
import { bridgeApi } from './api';
import type { BridgeArgs } from './bridge';
import { sendMessage } from './chat';

const url = 'ws://127.0.0.1:9'; // refused until a handler claims it
const args: BridgeArgs = { url, baseMs: 10, maxMs: 20 };
const link = ws.link(url);

const start = () => {
  const store = makeStore();
  const sub = store.dispatch(bridgeApi.endpoints.stream.initiate(args));
  return { store, stop: () => sub.unsubscribe() };
};

const messages = (store: ReturnType<typeof makeStore>, peer = 'bob') =>
  store.getState().conversations.byPeer[peer] ?? [];

describe('bridge stream', () => {
  it('stores inbound messages and ignores malformed frames', async () => {
    server.use(
      link.addEventListener('connection', ({ client }) => {
        client.send('garbage');
        client.send(JSON.stringify({ type: 'message_received', id: 'x', from: 'bob', content: 'yo', ts: 1 }));
      }),
    );
    const { store, stop } = start();
    await vi.waitFor(() => expect(messages(store)).toHaveLength(1));
    expect(messages(store)[0]).toMatchObject({ content: 'yo', direction: 'in' });
    stop();
  });

  it('queues while offline, then flushes in order on reconnect', async () => {
    // No stream yet, so there is no client: sends can only queue.
    const store = makeStore();
    store.dispatch(connectionChanged('disconnected'));
    store.dispatch(sendMessage('bob', 'first'));
    store.dispatch(sendMessage('bob', 'second'));
    expect(messages(store).map((m) => m.status)).toEqual(['pending', 'pending']);

    const received: string[] = [];
    server.use(
      link.addEventListener('connection', ({ client }) => {
        client.addEventListener('message', (event) => {
          received.push((JSON.parse(String(event.data)) as { content: string }).content);
        });
      }),
    );
    const sub = store.dispatch(bridgeApi.endpoints.stream.initiate(args));
    await vi.waitFor(() => expect(received).toEqual(['first', 'second']));
    expect(messages(store).map((m) => m.status)).toEqual(['sent', 'sent']);
    sub.unsubscribe();
  });

  it('applies delivery status updates', async () => {
    server.use(
      link.addEventListener('connection', ({ client }) => {
        client.addEventListener('message', (event) => {
          const { id } = JSON.parse(String(event.data)) as { id: string };
          client.send(JSON.stringify({ type: 'delivery_status', id, status: 'delivered' }));
        });
      }),
    );
    const { store, stop } = start();
    await vi.waitFor(() => expect(store.getState().connection.status).toBe('connected'));
    store.dispatch(sendMessage('bob', 'hello'));
    await vi.waitFor(() => expect(messages(store)[0]?.status).toBe('delivered'));
    stop();
  });

  it('reconnects after the bridge drops', async () => {
    let connections = 0;
    server.use(
      link.addEventListener('connection', ({ client }) => {
        connections += 1;
        if (connections === 1) client.close();
      }),
    );
    const { store, stop } = start();
    await vi.waitFor(() => expect(connections).toBe(2));
    await vi.waitFor(() => expect(store.getState().connection.status).toBe('connected'));
    stop();
  });
});
