import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ws } from 'msw';
import { App } from '@/App';
import { Chat } from '@/views/Chat/Chat';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/test/utils';

const url = 'ws://127.0.0.1:9';
const bridge = { url, baseMs: 10, maxMs: 20 };
const link = ws.link(url);

const livePeer = link.addEventListener('connection', ({ client }) => {
  client.send(JSON.stringify({ type: 'neighbor_discovered', id: 'bob', transport: 'ble', rssi: -50 }));
  client.addEventListener('message', (event) => {
    const { id } = JSON.parse(String(event.data)) as { id: string };
    client.send(JSON.stringify({ type: 'delivery_status', id, status: 'delivered' }));
  });
});

describe('Chat', () => {
  it('disables the composer until a peer is selected', async () => {
    server.use(livePeer);
    renderWithProviders(<App bridge={bridge} />);
    expect(await screen.findByText('Select a peer to start chatting.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeDisabled();
  });

  it('sends a message and shows it delivered', async () => {
    server.use(livePeer);
    const user = userEvent.setup();
    renderWithProviders(<App bridge={bridge} />);

    await user.click(await screen.findByRole('button', { name: /bob/ }));
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'hello there');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    const thread = screen.getByRole('log');
    expect(within(thread).getByText('hello there')).toBeInTheDocument();
    expect(await within(thread).findByRole('img', { name: 'Delivered' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
  });

  it('warns when the bridge is offline and queues the message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Chat />, {
      peers: { bob: { id: 'bob', online: false } },
      connection: { status: 'disconnected', address: null, error: null },
    });

    expect(screen.getByText(/Bridge offline/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /bob/ }));
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'later');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      await within(screen.getByRole('log')).findByRole('img', { name: 'Waiting to send' }),
    ).toBeInTheDocument();
  });
});
