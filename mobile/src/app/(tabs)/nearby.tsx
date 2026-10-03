import { BottomSheet, Button, Column, Host, List, ListItem, Row, Text } from '@expo/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MeshBanner } from '@/components/chat/mesh-banner';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { initials, signalBars, transportLabel } from '@/lib/format';
import { useChat } from '@/store/chat-store';

export default function NearbyScreen() {
  const { peers, myAddress, startCall } = useChat();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = peers.find((p) => p.id === selectedId) ?? null;

  const close = () => setSelectedId(null);
  const message = (id: string) => {
    close();
    router.push({ pathname: '/chat/[id]', params: { id } });
  };
  const call = async (id: string) => {
    close();
    const callId = await startCall(id);
    router.push({ pathname: '/call/[id]', params: { id: callId } });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ThemedText type="subtitle" style={styles.title}>
        Nearby
      </ThemedText>
      <MeshBanner />
      <ThemedText type="small" themeColor="textSecondary" style={styles.address} selectable>
        Your address: {myAddress ?? '…'}
      </ThemedText>

      {peers.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText type="smallBold">Looking for peers…</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Keep Bluetooth on and open the app on another device nearby.
          </ThemedText>
        </View>
      ) : (
        <Host style={styles.flex}>
          <List>
            {peers.map((p) => (
              <ListItem
                key={p.id}
                onPress={() => setSelectedId(p.id)}
                leading={<Text textStyle={{ fontWeight: 'bold' }}>{initials(p.name)}</Text>}
                supportingText={`${transportLabel(p.transport)}${p.rssi != null ? ` · ${signalBars(p.rssi)}` : ''}`}
                trailing={<Text textStyle={{ color: p.online ? '#30A46C' : '#8B8D98' }}>{p.online ? 'Online' : 'Out of range'}</Text>}>
                <Text textStyle={{ fontWeight: '600' }}>{p.name}</Text>
              </ListItem>
            ))}
          </List>

          <BottomSheet isPresented={selected != null} onDismiss={close} snapPoints={[{ height: 260 }]}>
            {selected && (
              <Column spacing={12} style={{ padding: 20 }}>
                <Text textStyle={{ fontSize: 20, fontWeight: 'bold' }}>{selected.name}</Text>
                <Text numberOfLines={1}>{selected.id}</Text>
                <Row spacing={12}>
                  <Button onPress={() => message(selected.id)}>Message</Button>
                  <Button variant="outlined" onPress={() => call(selected.id)} disabled={!selected.online}>
                    Call
                  </Button>
                </Row>
              </Column>
            )}
          </BottomSheet>
        </Host>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  title: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two },
  address: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.five },
  center: { textAlign: 'center' },
});
