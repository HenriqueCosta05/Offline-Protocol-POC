export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed';
export type BridgeStatus = 'connecting' | 'connected' | 'disconnected';

export interface ChatMessage {
  id: string;
  peerId: string;
  direction: 'in' | 'out';
  content: string;
  ts: number;
  status: MessageStatus;
}

export interface Peer {
  id: string;
  transport?: string;
  rssi?: number;
  online: boolean;
}
