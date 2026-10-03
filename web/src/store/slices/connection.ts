import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BridgeStatus } from '@/@types/chat';

export interface ConnectionState {
  status: BridgeStatus;
  address: string | null;
  error: string | null;
}

const initialState: ConnectionState = { status: 'connecting', address: null, error: null };

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    connectionChanged(state, { payload }: PayloadAction<BridgeStatus>) {
      state.status = payload;
      if (payload === 'connected') state.error = null;
    },
    identitySet(state, { payload }: PayloadAction<string>) {
      state.address = payload;
    },
    bridgeErrored(state, { payload }: PayloadAction<string>) {
      state.error = payload;
    },
  },
});

export const { connectionChanged, identitySet, bridgeErrored } = connectionSlice.actions;
export default connectionSlice.reducer;
