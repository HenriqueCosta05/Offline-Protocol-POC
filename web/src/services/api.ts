import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { connectionChanged } from '@/store/slices/connection';
import { parseFrame } from '@/utils/frames';
import { connectBridge, setActiveClient, type BridgeArgs } from './bridge';
import { applyFrame, flushOutbox } from './chat';

/** The bridge is a long-lived WebSocket, modelled as a streaming RTK Query entry. */
export const bridgeApi = createApi({
  reducerPath: 'bridgeApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    stream: build.query<null, BridgeArgs>({
      queryFn: () => ({ data: null }),
      async onCacheEntryAdded(args, { dispatch, cacheEntryRemoved }) {
        dispatch(connectionChanged('connecting'));
        const client = connectBridge(args, {
          onOpen: () => {
            dispatch(connectionChanged('connected'));
            dispatch(flushOutbox());
          },
          onClose: () => dispatch(connectionChanged('disconnected')),
          onMessage: (data) => {
            const frame = parseFrame(data);
            if (frame) dispatch(applyFrame(frame));
          },
        });
        setActiveClient(client);
        await cacheEntryRemoved;
        client.close();
        setActiveClient(null);
      },
    }),
  }),
});

export const { useStreamQuery } = bridgeApi;
