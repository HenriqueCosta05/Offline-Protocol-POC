import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Peer } from '@/@types/chat';
import { connectionChanged } from './connection';
import { messageQueued, messageReceived } from './conversations';

export type PeersState = Record<string, Peer>;

const initialState: PeersState = {};

const ensurePeer = (state: PeersState, id: string) => {
  state[id] ??= { id, online: false };
};

const peersSlice = createSlice({
  name: 'peers',
  initialState,
  reducers: {
    peerFound(state, { payload }: PayloadAction<Omit<Peer, 'online'>>) {
      state[payload.id] = { ...state[payload.id], ...payload, online: true };
    },
    peerLost(state, { payload }: PayloadAction<string>) {
      const peer = state[payload];
      if (peer) peer.online = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(messageReceived, (state, { payload }) => ensurePeer(state, payload.peerId))
      .addCase(messageQueued, (state, { payload }) => ensurePeer(state, payload.peerId))
      .addCase(connectionChanged, (state, { payload }) => {
        if (payload !== 'connected') {
          for (const peer of Object.values(state)) peer.online = false;
        }
      });
  },
});

export const { peerFound, peerLost } = peersSlice.actions;
export default peersSlice.reducer;
