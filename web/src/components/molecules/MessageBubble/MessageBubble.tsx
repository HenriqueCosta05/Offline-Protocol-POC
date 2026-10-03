import { Typography } from '@mui/material';
import type { ChatMessage } from '@/@types/chat';
import { StatusTick } from '@/components/atoms/StatusTick/StatusTick';
import { Bubble, BubbleRow } from './MessageBubble.style';

export interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const outgoing = message.direction === 'out';
  return (
    <BubbleRow outgoing={outgoing}>
      <Bubble outgoing={outgoing}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {message.content}
        </Typography>
        {outgoing && <StatusTick status={message.status} />}
      </Bubble>
    </BubbleRow>
  );
}
