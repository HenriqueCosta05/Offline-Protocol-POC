import { Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatMessage } from '@/@types/chat';
import { MessageBubble } from '@/components/molecules/MessageBubble/MessageBubble';
import { ThreadScroller } from './MessageThread.style';

export interface MessageThreadProps {
  peerId: string | null;
  messages: ChatMessage[];
}

export function MessageThread({ peerId, messages }: MessageThreadProps) {
  const { t } = useTranslation();
  const scroller = useRef<HTMLElement>(null);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages.length]);

  if (!peerId) {
    return (
      <ThreadScroller>
        <Typography color="text.secondary">{t('thread.selectPeer')}</Typography>
      </ThreadScroller>
    );
  }

  return (
    <ThreadScroller ref={scroller} role="log" aria-label={t('thread.with', { peer: peerId })}>
      {messages.length === 0 ? (
        <Typography color="text.secondary">{t('thread.empty')}</Typography>
      ) : (
        messages.map((message) => <MessageBubble key={message.id} message={message} />)
      )}
    </ThreadScroller>
  );
}
