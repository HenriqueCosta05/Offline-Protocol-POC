import { Button, Column, Host, Row, Text } from '@expo/ui';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { duration, initials, transportLabel } from '@/lib/format';
import { useChat } from '@/store/chat-store';

const BG = '#0B1220';

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { calls, getPeer, acceptCall, declineCall, endCall } = useChat();
  const call = calls.find((c) => c.id === id);
  const peer = getPeer(call?.peerId ?? '');
  const [now, setNow] = useState(() => Date.now());

  const status = call?.status;
  const incoming = call?.direction === 'in' && status === 'ringing';

  useEffect(() => {
    if (status !== 'active') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (incoming) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [incoming]);

  // Leave the screen shortly after the call finishes so the final state is readable.
  const finished = !call || status === 'ended' || status === 'missed' || status === 'declined';
  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/chats')), call ? 1200 : 0);
    return () => clearTimeout(t);
  }, [finished, call]);

  const label = !call
    ? 'Call not found'
    : status === 'active'
      ? duration(now - (call.answeredAt ?? now))
      : status === 'ringing'
        ? incoming
          ? 'Incoming call…'
          : 'Calling…'
        : status === 'missed'
          ? call.direction === 'in'
            ? 'Missed'
            : 'No answer'
          : status === 'declined'
            ? 'Declined'
            : 'Call ended';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>{initials(peer.name)}</ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.light}>
          {peer.name}
        </ThemedText>
        <ThemedText style={styles.dim}>{label}</ThemedText>
        <ThemedText type="small" style={styles.dim}>
          Offline mesh · {transportLabel(peer.transport)} · end-to-end encrypted signalling
        </ThemedText>
      </View>

      <Host matchContents={{ vertical: true }} style={styles.actions}>
        <Column alignment="center" spacing={12}>
          {incoming ? (
            <Row spacing={16}>
              <Button variant="outlined" onPress={() => declineCall(id)}>
                Decline
              </Button>
              <Button onPress={() => acceptCall(id)}>Accept</Button>
            </Row>
          ) : (
            !finished && <Button onPress={() => endCall(id)}>{status === 'ringing' ? 'Cancel' : 'End call'}</Button>
          )}
          {finished && <Text textStyle={{ color: '#9AA4B2' }}>Returning…</Text>}
        </Column>
      </Host>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, justifyContent: 'space-between' },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 44, fontWeight: '700', lineHeight: 52 },
  light: { color: '#fff' },
  dim: { color: '#9AA4B2', textAlign: 'center' },
  actions: { paddingBottom: 32, paddingHorizontal: 24 },
});
