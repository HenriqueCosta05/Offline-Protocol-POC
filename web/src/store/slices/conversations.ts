import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage, MessageStatus } from '@/@types/chat';

export interface ConversationsState {
  byPeer: Record<string, ChatMessage[]>;
}

const initialState: ConversationsState = { byPeer: {} };

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    messageQueued(state, { payload }: PayloadAction<ChatMessage>) {
      (state.byPeer[payload.peerId] ??= []).push(payload);
    },
    messageReceived(state, { payload }: PayloadAction<ChatMessage>) {
      const list = (state.byPeer[payload.peerId] ??= []);
      if (!list.some((m) => m.id === payload.id)) list.push(payload);
    },
    statusUpdated(state, { payload }: PayloadAction<{ id: string; status: MessageStatus }>) {
      for (const list of Object.values(state.byPeer)) {
        const message = list.find((m) => m.id === payload.id);
        if (message) {
          // Delivered is terminal: a late "sent"/"failed" must not downgrade it.
          if (message.status !== 'delivered') message.status = payload.status;
          return;
        }
      }
    },
  },
});

export const { messageQueued, messageReceived, statusUpdated } = conversationsSlice.actions;
export default conversationsSlice.reducer;

export const selectOutbox = createSelector(
  (state: { conversations: ConversationsState }) => state.conversations.byPeer,
  (byPeer) =>
    Object.values(byPeer)
      .flat()
      .filter((m) => m.direction === 'out' && m.status === 'pending')
      .sort((a, b) => a.ts - b.ts),
);
