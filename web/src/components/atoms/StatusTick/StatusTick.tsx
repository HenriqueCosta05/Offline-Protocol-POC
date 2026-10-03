import { useTranslation } from 'react-i18next';
import type { MessageStatus } from '@/@types/chat';
import { Tick } from './StatusTick.style';

const GLYPH: Record<MessageStatus, string> = {
  pending: '○',
  sent: '✓',
  delivered: '✓✓',
  failed: '!',
};

export interface StatusTickProps {
  status: MessageStatus;
}

export function StatusTick({ status }: StatusTickProps) {
  const { t } = useTranslation();
  return (
    <Tick role="img" aria-label={t(`message.status.${status}`)} status={status}>
      {GLYPH[status]}
    </Tick>
  );
}
