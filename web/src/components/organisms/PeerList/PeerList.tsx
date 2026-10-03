import { List, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Peer } from '@/@types/chat';
import { PeerItem } from '@/components/molecules/PeerItem/PeerItem';
import { PeerListRoot } from './PeerList.style';

export interface PeerListProps {
  peers: Peer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PeerList({ peers, selectedId, onSelect }: PeerListProps) {
  const { t } = useTranslation();
  return (
    <PeerListRoot as="nav" aria-label={t('peers.title')}>
      <Typography variant="overline" color="text.secondary">
        {t('peers.title')}
      </Typography>
      {peers.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('peers.empty')}
        </Typography>
      ) : (
        <List disablePadding>
          {peers.map((peer) => (
            <PeerItem key={peer.id} peer={peer} selected={peer.id === selectedId} onSelect={onSelect} />
          ))}
        </List>
      )}
    </PeerListRoot>
  );
}
