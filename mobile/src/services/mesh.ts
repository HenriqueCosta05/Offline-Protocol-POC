import {
  MessagePriority,
  OfflineProtocol,
  type IdentityReadyEvent,
  type MessageDeliveredEvent,
  type MessageFailedEvent,
  type MessageReceivedEvent,
  type MessageUndeliverableEvent,
  type NeighborDiscoveredEvent,
  type NeighborLostEvent,
  type TransportSwitchedEvent,
} from '@offline-protocol/mesh-sdk';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

/** The SDK is a native module: it only exists in a development build, never in Expo Go. */
export const meshAvailable = Boolean(NativeModules.OfflineProtocolModule);

export type MeshHandlers = {
  onIdentity: (address: string) => void;
  onPeerFound: (peer: { id: string; transport: string; rssi?: number }) => void;
  onPeerLost: (id: string) => void;
  onMessage: (msg: { id: string; from: string; content: string; ts: number }) => void;
  onDelivery: (id: string, status: 'delivered' | 'failed') => void;
  onTransport: (transport: string) => void;
};

export interface MeshClient {
  readonly mode: 'native' | 'demo';
  start(handlers: MeshHandlers): Promise<void>;
  stop(): Promise<void>;
  send(to: string, content: string, priority?: 'normal' | 'urgent'): Promise<string>;
}

async function requestAndroidPermissions() {
  if (Platform.OS !== 'android') return;
  const api = Number(Platform.Version);
  const wanted =
    api >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  if (api >= 33) wanted.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
  await PermissionsAndroid.requestMultiple(wanted);
}

class NativeMesh implements MeshClient {
  readonly mode = 'native' as const;
  private protocol: OfflineProtocol | null = null;

  async start(h: MeshHandlers) {
    await requestAndroidPermissions();
    const protocol = new OfflineProtocol({ appId: 'offline-protocol-poc', profile: 'default' });
    this.protocol = protocol;

    protocol.on<IdentityReadyEvent>('identity_ready', (e) => h.onIdentity(e.address));
    protocol.on<NeighborDiscoveredEvent>('neighbor_discovered', (e) =>
      h.onPeerFound({ id: e.peer_id, transport: e.transport, rssi: e.rssi }),
    );
    protocol.on<NeighborLostEvent>('neighbor_lost', (e) => h.onPeerLost(e.peer_id));
    protocol.on<MessageReceivedEvent>('message_received', (e) =>
      h.onMessage({ id: e.message_id, from: e.sender, content: e.content, ts: e.timestamp }),
    );
    protocol.on<MessageDeliveredEvent>('message_delivered', (e) => h.onDelivery(e.message_id, 'delivered'));
    protocol.on<MessageFailedEvent>('message_failed', (e) => h.onDelivery(e.message_id, 'failed'));
    protocol.on<MessageUndeliverableEvent>('message_undeliverable', (e) => h.onDelivery(e.message_id, 'failed'));
    protocol.on<TransportSwitchedEvent>('transport_switched', (e) => h.onTransport(e.to));

    await protocol.start();
    const address = await protocol.localAddress();
    if (address) h.onIdentity(address);
  }

  async stop() {
    const p = this.protocol;
    this.protocol = null;
    if (!p) return;
    await p.stop();
    await p.destroy();
  }

  async send(to: string, content: string, priority: 'normal' | 'urgent' = 'normal') {
    if (!this.protocol) throw new Error('Mesh not started');
    return this.protocol.sendMessage({
      recipient: to,
      content,
      priority: priority === 'urgent' ? MessagePriority.Critical : MessagePriority.Medium,
    });
  }
}

const DEMO_PEERS = [
  { id: 'off1demoana0000', transport: 'ble', rssi: -48 },
  { id: 'off1demobruno000', transport: 'wifi_direct', rssi: -61 },
  { id: 'off1democarla000', transport: 'ble', rssi: -79 },
];

/** Simulated mesh so the UI is usable in Expo Go / on web. Peers echo and answer calls. */
class DemoMesh implements MeshClient {
  readonly mode = 'demo' as const;
  private h: MeshHandlers | null = null;
  private timers = new Set<ReturnType<typeof setTimeout>>();

  private later(ms: number, fn: () => void) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  async start(h: MeshHandlers) {
    this.h = h;
    h.onIdentity('off1demoself0000');
    h.onTransport('ble');
    DEMO_PEERS.forEach((p, i) => this.later(400 + i * 700, () => h.onPeerFound(p)));
  }

  async stop() {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.h = null;
  }

  async send(to: string, content: string) {
    const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.later(500, () => this.h?.onDelivery(id, 'delivered'));

    const call = parseDemoCall(content);
    if (call?.t === 'invite') {
      this.later(2500, () => this.reply(to, `@@call:${JSON.stringify({ t: 'accept', id: call.id })}`));
    } else if (!call) {
      this.later(1400, () => this.reply(to, `Echo from the mesh: ${content}`));
    }
    return id;
  }

  private reply(from: string, content: string) {
    this.h?.onMessage({ id: `demo-in-${Date.now()}`, from, content, ts: Date.now() });
  }
}

function parseDemoCall(content: string): { t: string; id: string } | null {
  if (!content.startsWith('@@call:')) return null;
  try {
    return JSON.parse(content.slice(7));
  } catch {
    return null;
  }
}

export function createMesh(): MeshClient {
  return meshAvailable ? new NativeMesh() : new DemoMesh();
}
