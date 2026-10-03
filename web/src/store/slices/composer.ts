import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { messageQueued } from './conversations';

export interface ComposerState {
  selectedPeerId: string | null;
  draft: string;
}

const initialState: ComposerState = { selectedPeerId: null, draft: '' };

const composerSlice = createSlice({
  name: 'composer',
  initialState,
  reducers: {
    peerSelected(state, { payload }: PayloadAction<string>) {
      state.selectedPeerId = payload;
    },
    draftChanged(state, { payload }: PayloadAction<string>) {
      state.draft = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(messageQueued, (state) => {
      state.draft = '';
    });
  },
});

export const { peerSelected, draftChanged } = composerSlice.actions;
export default composerSlice.reducer;
