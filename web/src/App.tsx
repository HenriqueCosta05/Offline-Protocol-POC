import { CssBaseline, ThemeProvider } from '@mui/material';
import { useStreamQuery } from '@/services/api';
import { DEFAULT_BRIDGE, type BridgeArgs } from '@/services/bridge';
import { theme } from '@/theme';
import { Chat } from '@/views/Chat/Chat';

export interface AppProps {
  bridge?: BridgeArgs;
}

export function App({ bridge = DEFAULT_BRIDGE }: AppProps) {
  useStreamQuery(bridge);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Chat />
    </ThemeProvider>
  );
}
