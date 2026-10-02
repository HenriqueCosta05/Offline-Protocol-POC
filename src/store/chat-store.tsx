import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { decodeSignal, encodeSignal, type CallSignal } from '@/services/call-signal';
import { createMesh, meshAvailable, type MeshClient } from '@/services/mesh';

export type Peer = { id: string; name: string; transport: string; rssi?: number; online: boolean };
export type MsgStatus = 'sent' | 'delivered' | 'failed';
export type Msg = { id: string; peerId: string; mine: boolean; text: string; ts: number; status: MsgStatus };
export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed' | 'declined';
export type CallRecord = {
  id: string;
  peerId: string;
  direction: 'in' | 'out';
  status: CallStatus;
  startedAt: number;
  answeredAt?: number;
  endedAt?: number;
};

const RING_TIMEOUT_MS = 30_000;

export function peerLabel(id: string) {
  const known: Record<string, string> = {
    off1demoana0000: 'Ana',
    off1demobruno000: 'Bruno',
    off1democarla000: 'Carla',
  };
  return known[id] ?? `Peer ${id.replace(/^off1/, '').slice(0, 6)}`;
}

type ChatContextValue = {
  mode: 'native' | 'demo';
  ready: boolean;
  error: string | null;
  myAddress: string | null;
  transport: string | null;
  peers: Peer[];
  messages: Msg[];
  calls: CallRecord[];
  unread: Record<string, number>;
  getPeer: (id: string) => Peer;
  openChat: (peerId: string) => void;
  sendMessage: (peerId: string, text: string) => Promise<void>;
  startCall: (peerId: string) => Promise<string>;
  acceptCall: (callId: string) => Promise<void>;
  declineCall: (callId: string) => Promise<void>;
  endCall: (callId: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const mesh = useRef<MeshClient | null>(null);
  const mode = meshAvailable ? 'native' : 'demo';
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myAddress, setMyAddress] = useState<string | null>(null);
  const [transport, setTransport] = useState<string | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const ringTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const patchCall = useCallback((id: string, patch: Partial<CallRecord>) => {
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const clearRing = useCallback((id: string) => {
    const t = ringTimers.current.get(id);
    if (t) clearTimeout(t);
    ringTimers.current.delete(id);
  }, []);

  const armRing = useCallback(
    (id: string) => {
      clearRing(id);
      ringTimers.current.set(
        id,
        setTimeout(() => {
          ringTimers.current.delete(id);
          setCalls((prev) =>
            prev.map((c) => (c.id === id && c.status === 'ringing' ? { ...c, status: 'missed', endedAt: Date.now() } : c)),
          );
        }, RING_TIMEOUT_MS),
      );
    },
    [clearRing],
  );

  const upsertPeer = useCallback((id: string, patch: Partial<Peer>) => {
    setPeers((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      if (i === -1) return [...prev, { id, name: peerLabel(id), transport: 'ble', online: true, ...patch }];
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }, []);

  const handleSignal = useCallback(
    (from: string, s: CallSignal) => {
      switch (s.t) {
        case 'invite':
          setCalls((prev) =>
            prev.some((c) => c.id === s.id)
              ? prev
              : [...prev, { id: s.id, peerId: from, direction: 'in', status: 'ringing', startedAt: Date.now() }],
          );
          armRing(s.id);
          break;
        case 'accept':
          clearRing(s.id);
          patchCall(s.id, { status: 'active', answeredAt: Date.now() });
          break;
        case 'decline':
          clearRing(s.id);
          patchCall(s.id, { status: 'declined', endedAt: Date.now() });
          break;
        case 'end':
          clearRing(s.id);
          setCalls((prev) =>
            prev.map((c) =>
              c.id !== s.id
                ? c
                : { ...c, status: c.status === 'ringing' ? 'missed' : 'ended', endedAt: Date.now() },
            ),
          );
          break;
      }
    },
    [armRing, clearRing, patchCall],
  );

  useEffect(() => {
    const client = createMesh();
    mesh.current = client;
    let cancelled = false;
    const timers = ringTimers.current;

    client
      .start({
        onIdentity: setMyAddress,
        onTransport: setTransport,
        onPeerFound: (p) => upsertPeer(p.id, { transport: p.transport, rssi: p.rssi, online: true }),
        onPeerLost: (id) => upsertPeer(id, { online: false }),
        onDelivery: (id, status) =>
          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m))),
        onMessage: (m) => {
          upsertPeer(m.from, { online: true });
          const signal = decodeSignal(m.content);
          if (signal) return handleSignal(m.from, signal);
          setMessages((prev) =>
            prev.some((x) => x.id === m.id)
              ? prev
              : [...prev, { id: m.id, peerId: m.from, mine: false, text: m.content, ts: m.ts || Date.now(), status: 'delivered' }],
          );
          setUnread((u) => ({ ...u, [m.from]: (u[m.from] ?? 0) + 1 }));
        },
      })
      .then(() => !cancelled && setReady(true))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      timers.clear();
      client.stop().catch(() => {});
    };
  }, [handleSignal, upsertPeer]);

  const sendRaw = useCallback(async (peerId: string, content: string, urgent = false) => {
    if (!mesh.current) throw new Error('Mesh not started');
    return mesh.current.send(peerId, content, urgent ? 'urgent' : 'normal');
  }, []);

  const sendMessage = useCallback(
    async (peerId: string, text: string) => {
      const body = text.trim();
      if (!body) return;
      try {
        const id = await sendRaw(peerId, body);
        setMessages((prev) => [...prev, { id, peerId, mine: true, text: body, ts: Date.now(), status: 'sent' }]);
      } catch {
        const id = `failed-${Date.now()}`;
        setMessages((prev) => [...prev, { id, peerId, mine: true, text: body, ts: Date.now(), status: 'failed' }]);
      }
    },
    [sendRaw],
  );

  const startCall = useCallback(
    async (peerId: string) => {
      const id = `call-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      setCalls((prev) => [...prev, { id, peerId, direction: 'out', status: 'ringing', startedAt: Date.now() }]);
      armRing(id);
      sendRaw(peerId, encodeSignal({ t: 'invite', id }), true).catch(() =>
        patchCall(id, { status: 'missed', endedAt: Date.now() }),
      );
      return id;
    },
    [armRing, patchCall, sendRaw],
  );

  const respond = useCallback(
    async (callId: string, t: 'accept' | 'decline' | 'end') => {
      const call = calls.find((c) => c.id === callId);
      if (!call) return;
      clearRing(callId);
      const now = Date.now();
      if (t === 'accept') patchCall(callId, { status: 'active', answeredAt: now });
      else if (t === 'decline') patchCall(callId, { status: 'declined', endedAt: now });
      else patchCall(callId, { status: call.status === 'ringing' ? 'missed' : 'ended', endedAt: now });
      await sendRaw(call.peerId, encodeSignal({ t, id: callId }), true).catch(() => {});
    },
    [calls, clearRing, patchCall, sendRaw],
  );

  const getPeer = useCallback(
    (id: string): Peer => peers.find((p) => p.id === id) ?? { id, name: peerLabel(id), transport: 'ble', online: false },
    [peers],
  );

  const openChat = useCallback((peerId: string) => {
    setUnread((u) => (u[peerId] ? { ...u, [peerId]: 0 } : u));
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      mode,
      ready,
      error,
      myAddress,
      transport,
      peers,
      messages,
      calls,
      unread,
      getPeer,
      openChat,
      sendMessage,
      startCall,
      acceptCall: (id) => respond(id, 'accept'),
      declineCall: (id) => respond(id, 'decline'),
      endCall: (id) => respond(id, 'end'),
    }),
    [mode, ready, error, myAddress, transport, peers, messages, calls, unread, getPeer, openChat, sendMessage, startCall, respond],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
