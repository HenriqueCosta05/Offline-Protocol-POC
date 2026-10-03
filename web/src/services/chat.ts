import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '@/@types/chat';
import type { ServerFrame } from '@/@types/frames';
import type { RootState } from '@/store';
import { bridgeErrored, identitySet } from '@/store/slices/connection';
import {
  messageQueued,
  messageReceived,
  selectOutbox,
  statusUpdated,
} from '@/store/slices/conversations';
import { peerFound, peerLost } from '@/store/slices/peers';
import { newId } from '@/utils/id';
import { getActiveClient } from './bridge';

type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>;

/** Sends every pending message, oldest first, while the bridge is reachable. */
export const flushOutbox = (): AppThunk => (dispatch, getState) => {
  const client = getActiveClient();
  if (!client || getState().connection.status !== 'connected') return;
  for (const message of selectOutbox(getState())) {
    const sent = client.send({
      type: 'send_message',
      id: message.id,
      to: message.peerId,
      content: message.content,
    });
    if (!sent) return;
    dispatch(statusUpdated({ id: message.id, status: 'sent' }));
  }
};

/** Queues a message locally (offline-first), then flushes if the bridge is up. */
export const sendMessage =
  (to: string, content: string): AppThunk =>
  (dispatch) => {
    const message: ChatMessage = {
      id: newId(),
      peerId: to,
      direction: 'out',
      content,
      ts: Date.now(),
      status: 'pending',
    };
    dispatch(messageQueued(message));
    dispatch(flushOutbox());
  };

/** Routes a validated bridge frame into the store. */
export const applyFrame =
  (frame: ServerFrame): AppThunk =>
  (dispatch) => {
    switch (frame.type) {
      case 'identity':
        dispatch(identitySet(frame.address));
        break;
      case 'message_received':
        dispatch(
          messageReceived({
            id: frame.id,
            peerId: frame.from,
            direction: 'in',
            content: frame.content,
            ts: frame.ts,
            status: 'delivered',
          }),
        );
        break;
      case 'neighbor_discovered':
        dispatch(peerFound({ id: frame.id, transport: frame.transport, rssi: frame.rssi }));
        break;
      case 'neighbor_lost':
        dispatch(peerLost(frame.id));
        break;
      case 'delivery_status':
        dispatch(statusUpdated({ id: frame.id, status: frame.status }));
        break;
      case 'error':
        dispatch(bridgeErrored(frame.message));
        break;
    }
  };
