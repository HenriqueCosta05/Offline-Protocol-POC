import { Chip, ListItemText } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Peer } from '@/@types/chat';
import { PeerButton } from './PeerItem.style';

export interface PeerItemProps {
  peer: Peer;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function PeerItem({ peer, selected, onSelect }: PeerItemProps) {
  const { t } = useTranslation();
  const detail = [peer.transport, peer.rssi !== undefined ? t('peers.signal', { rssi: peer.rssi }) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <PeerButton selected={selected} onClick={() => onSelect(peer.id)}>
      <ListItemText primary={peer.id} secondary={detail || undefined} />
      {!peer.online && <Chip size="small" label={t('peers.offline')} />}
    </PeerButton>
  );
}
