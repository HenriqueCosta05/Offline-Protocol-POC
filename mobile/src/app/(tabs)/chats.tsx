import { Host, List, ListItem, Text } from '@expo/ui';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MeshBanner } from '@/components/chat/mesh-banner';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { clock, initials } from '@/lib/format';
import { useChat } from '@/store/chat-store';

export default function ChatsScreen() {
  const { messages, getPeer, unread } = useChat();

  const conversations = useMemo(() => {
    const last = new Map<string, (typeof messages)[number]>();
    for (const m of messages) last.set(m.peerId, m);
    return [...last.values()].sort((a, b) => b.ts - a.ts);
  }, [messages]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ThemedText type="subtitle" style={styles.title}>
        Messages
      </ThemedText>
      <MeshBanner />

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText type="smallBold">No conversations yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Open the Nearby tab to find people around you and start chatting, with or without internet.
          </ThemedText>
        </View>
      ) : (
        <Host style={styles.flex}>
          <List>
            {conversations.map((m) => {
              const peer = getPeer(m.peerId);
              const count = unread[m.peerId] ?? 0;
              return (
                <ListItem
                  key={m.peerId}
                  onPress={() => router.push({ pathname: '/chat/[id]', params: { id: m.peerId } })}
                  leading={<Text textStyle={{ fontWeight: 'bold' }}>{initials(peer.name)}</Text>}
                  supportingText={(m.mine ? 'You: ' : '') + m.text}
                  trailing={<Text>{count > 0 ? `${count} new · ${clock(m.ts)}` : clock(m.ts)}</Text>}>
                  <Text textStyle={{ fontWeight: '600' }}>{peer.name}</Text>
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
