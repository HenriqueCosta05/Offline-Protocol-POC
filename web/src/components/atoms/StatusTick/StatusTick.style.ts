import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { MessageStatus } from '@/@types/chat';

export interface TickProps {
  status: MessageStatus;
}

export const Tick = styled(Typography, {
  name: 'StatusTick',
  slot: 'root',
  shouldForwardProp: (prop) => prop !== 'status',
})<TickProps>(({ theme, status }) => ({
  ...theme.typography.caption,
  marginLeft: theme.spacing(0.5),
  color: status === 'failed' ? (theme.vars ?? theme).palette.error.main : 'inherit',
  opacity: status === 'delivered' ? 1 : 0.7,
}));
