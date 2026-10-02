import { Host, List, ListItem, Text } from '@expo/ui';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MeshBanner } from '@/components/chat/mesh-banner';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { clock, duration, initials } from '@/lib/format';
import { useChat, type CallRecord } from '@/store/chat-store';

function describe(c: CallRecord) {
  const arrow = c.direction === 'in' ? 'Incoming' : 'Outgoing';
  switch (c.status) {
    case 'active':
      return `${arrow} · in progress`;
    case 'ringing':
      return `${arrow} · ringing`;
    case 'missed':
      return c.direction === 'in' ? 'Missed call' : 'No answer';
    case 'declined':
      return `${arrow} · declined`;
    default:
      return c.answeredAt && c.endedAt ? `${arrow} · ${duration(c.endedAt - c.answeredAt)}` : arrow;
  }
}

export default function CallsScreen() {
  const { calls, getPeer, startCall } = useChat();
  const history = useMemo(() => [...calls].sort((a, b) => b.startedAt - a.startedAt), [calls]);

  const callBack = async (peerId: string) => {
    const id = await startCall(peerId);
    router.push({ pathname: '/call/[id]', params: { id } });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ThemedText type="subtitle" style={styles.title}>
        Calls
      </ThemedText>
      <MeshBanner />

      {history.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText type="smallBold">No calls yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Start a call from a conversation or from the Nearby tab.
          </ThemedText>
        </View>
      ) : (
        <Host style={styles.flex}>
          <List>
            {history.map((c) => {
              const peer = getPeer(c.peerId);
              const live = c.status === 'ringing' || c.status === 'active';
              return (
                <ListItem
                  key={c.id}
                  onPress={() =>
                    live ? router.push({ pathname: '/call/[id]', params: { id: c.id } }) : callBack(c.peerId)
                  }
                  leading={<Text textStyle={{ fontWeight: 'bold' }}>{initials(peer.name)}</Text>}
                  supportingText={describe(c)}
                  trailing={<Text>{live ? 'Open' : clock(c.startedAt)}</Text>}>
                  <Text
                    textStyle={{
                      fontWeight: '600',
                      color: c.status === 'missed' && c.direction === 'in' ? '#E5484D' : undefined,
                    }}>
                    {peer.name}
                  </Text>
                </ListItem>
              );
            })}
          </List>
        </Host>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  title: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.five },
  center: { textAlign: 'center' },
});
