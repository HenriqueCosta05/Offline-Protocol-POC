import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Composer } from '@/components/molecules/Composer/Composer';
import { ConnectionBanner } from '@/components/organisms/ConnectionBanner/ConnectionBanner';
import { MessageThread } from '@/components/organisms/MessageThread/MessageThread';
import { PeerList } from '@/components/organisms/PeerList/PeerList';
import { sendMessage } from '@/services/chat';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { draftChanged, peerSelected } from '@/store/slices/composer';
import { Header, Main, Shell, Sidebar, ThreadPane } from './Chat.style';

export function Chat() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const peers = useAppSelector((s) => s.peers);
  const { selectedPeerId, draft } = useAppSelector((s) => s.composer);
  const { status, error } = useAppSelector((s) => s.connection);
  const byPeer = useAppSelector((s) => s.conversations.byPeer);

  const peerList = Object.values(peers).sort(
    (a, b) => Number(b.online) - Number(a.online) || a.id.localeCompare(b.id),
  );
  const messages = selectedPeerId ? (byPeer[selectedPeerId] ?? []) : [];

  return (
    <Shell>
      <Header>
        <Typography variant="h6" component="h1">
          {t('app.title')}
        </Typography>
      </Header>
      <ConnectionBanner status={status} error={error} />
      <Main>
        <Sidebar>
          <PeerList
            peers={peerList}
            selectedId={selectedPeerId}
            onSelect={(id) => dispatch(peerSelected(id))}
          />
        </Sidebar>
        <ThreadPane>
          <MessageThread peerId={selectedPeerId} messages={messages} />
          <Composer
            draft={draft}
            disabled={!selectedPeerId}
            onChange={(value) => dispatch(draftChanged(value))}
            onSend={() => selectedPeerId && dispatch(sendMessage(selectedPeerId, draft.trim()))}
          />
        </ThreadPane>
      </Main>
    </Shell>
  );
}
