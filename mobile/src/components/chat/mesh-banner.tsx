import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { transportLabel } from '@/lib/format';
import { useChat } from '@/store/chat-store';

/** One-line mesh status shown on top of the tab screens. */
export function MeshBanner() {
  const { mode, ready, error, transport, peers } = useChat();
  const online = peers.filter((p) => p.online).length;

  const text = error
    ? `Mesh error: ${error}`
    : mode === 'demo'
      ? 'Demo mode: simulated peers (SDK needs a development build)'
      : !ready
        ? 'Starting mesh…'
        : `${transportLabel(transport)} · ${online} nearby`;

  return (
    <View style={[styles.banner, { backgroundColor: error ? '#E5484D22' : mode === 'demo' ? '#F5A62322' : '#30A46C22' }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
});
