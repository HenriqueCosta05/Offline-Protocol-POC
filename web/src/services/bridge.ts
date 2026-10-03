import type { ClientCommand } from '@/@types/frames';

export interface BridgeArgs {
  url: string;
  baseMs: number;
  maxMs: number;
}

export const DEFAULT_BRIDGE: BridgeArgs = {
  url: import.meta.env.PUBLIC_BRIDGE_URL ?? 'ws://127.0.0.1:8765',
  baseMs: 500,
  maxMs: 10_000,
};

export interface BridgeHandlers {
  onOpen: () => void;
  onClose: () => void;
  onMessage: (data: unknown) => void;
}

export interface BridgeClient {
  /** Returns false when the socket is not open (caller keeps the message queued). */
  send: (command: ClientCommand) => boolean;
  close: () => void;
}

/** WebSocket client that reconnects with exponential backoff until closed. */
export function connectBridge(args: BridgeArgs, handlers: BridgeHandlers): BridgeClient {
  let socket: WebSocket | null = null;
  let closed = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const open = () => {
    const ws = new WebSocket(args.url);
    socket = ws;
    ws.onopen = () => {
      attempt = 0;
      handlers.onOpen();
    };
    ws.onmessage = (event) => handlers.onMessage(event.data);
    ws.onerror = () => ws.close();
    ws.onclose = () => {
      if (socket === ws) socket = null;
      handlers.onClose();
      if (!closed) {
        const delay = Math.min(args.maxMs, args.baseMs * 2 ** attempt);
        attempt += 1;
        timer = setTimeout(open, delay);
      }
    };
  };
  open();

  return {
    send(command) {
      if (socket?.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify(command));
      return true;
    },
    close() {
      closed = true;
      clearTimeout(timer);
      socket?.close();
    },
  };
}

let active: BridgeClient | null = null;
export const setActiveClient = (client: BridgeClient | null) => {
  active = client;
};
export const getActiveClient = () => active;
