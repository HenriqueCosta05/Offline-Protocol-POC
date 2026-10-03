import { ws } from 'msw';
import { DEFAULT_BRIDGE } from '@/services/bridge';

/** In-browser stand-in for the Python bridge: reports delivery, then echoes the message. */
export const bridgeLink = ws.link(DEFAULT_BRIDGE.url);

export const handlers = [
  bridgeLink.addEventListener('connection', ({ client }) => {
    client.send(JSON.stringify({ type: 'identity', address: 'me-mock' }));
    client.send(
      JSON.stringify({ type: 'neighbor_discovered', id: 'echo-bot', transport: 'ble', rssi: -52 }),
    );
    client.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      const command: unknown = JSON.parse(event.data);
      if (typeof command !== 'object' || command === null) return;
      const { type, id, to, content } = command as Record<string, string>;
      if (type !== 'send_message') return;
      setTimeout(() => client.send(JSON.stringify({ type: 'delivery_status', id, status: 'delivered' })), 200);
      setTimeout(
        () =>
          client.send(
            JSON.stringify({
              type: 'message_received',
              id: `echo-${id}`,
              from: to,
              content: `echo: ${content}`,
              ts: Date.now(),
            }),
          ),
        500,
      );
    });
  }),
];
