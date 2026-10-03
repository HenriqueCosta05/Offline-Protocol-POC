import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { clock } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import type { Msg } from '@/store/chat-store';

const STATUS: Record<Msg['status'], string> = { sent: 'Sent', delivered: 'Delivered', failed: 'Failed' };

export function MessageBubble({ msg }: { msg: Msg }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, msg.mine && styles.mine]}>
      <View style={[styles.bubble, { backgroundColor: msg.mine ? '#208AEF' : theme.backgroundElement }]}>
        <ThemedText style={{ color: msg.mine ? '#fff' : theme.text }}>{msg.text}</ThemedText>
        <ThemedText type="small" style={{ color: msg.mine ? '#ffffffcc' : theme.textSecondary, fontSize: 11 }}>
          {clock(msg.ts)}
          {msg.mine ? ` · ${STATUS[msg.status]}` : ''}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, alignItems: 'flex-start' },
  mine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, gap: 2 },
});
