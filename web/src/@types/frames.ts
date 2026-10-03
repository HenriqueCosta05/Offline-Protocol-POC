export type ServerFrame =
  | { type: 'identity'; address: string }
  | { type: 'message_received'; id: string; from: string; content: string; ts: number }
  | { type: 'neighbor_discovered'; id: string; transport: string; rssi?: number }
  | { type: 'neighbor_lost'; id: string }
  | { type: 'delivery_status'; id: string; status: 'delivered' | 'failed' }
  | { type: 'error'; code: string; message: string };

export type ClientCommand =
  | { type: 'send_message'; id: string; to: string; content: string }
  | { type: 'get_peers' };
