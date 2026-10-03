import { Button, Host, Row, TextInput, useNativeState } from '@expo/ui';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MessageBubble } from '@/components/chat/message-bubble';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useChat } from '@/store/chat-store';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { messages, getPeer, openChat, sendMessage, startCall } = useChat();
  const peer = getPeer(id);
  const text = useNativeState('');

  const thread = useMemo(() => messages.filter((m) => m.peerId === id).reverse(), [messages, id]);

  useEffect(() => {
    openChat(id);
  }, [id, openChat, thread.length]);

  const send = () => {
    const body = text.value;
    if (!body.trim()) return;
    text.set('');
    sendMessage(id, body);
  };

  const call = async () => {
    const callId = await startCall(id);
    router.push({ pathname: '/call/[id]', params: { id: callId } });
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: peer.name,
          headerRight: () => (
            <Pressable onPress={call} hitSlop={12} accessibilityRole="button" accessibilityLabel="Call">
              <ThemedText type="link">Call</ThemedText>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          data={thread}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary">
                Say hi to {peer.name}. Messages are end-to-end encrypted.
              </ThemedText>
            </View>
          }
        />
        <Host matchContents={{ vertical: true }} style={styles.composer}>
          <Row spacing={8} alignment="center">
            <TextInput
              value={text}
              placeholder="Message"
              onSubmitEditing={send}
              returnKeyType="send"
              style={{ padding: 10 }}
            />
            <Button onPress={send}>Send</Button>
          </Row>
        </Host>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingVertical: Spacing.two },
  empty: { padding: Spacing.four, alignItems: 'center', transform: [{ scaleY: -1 }] },
  composer: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
