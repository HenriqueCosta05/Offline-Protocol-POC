import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ThreadScroller = styled(Box, { name: 'MessageThread', slot: 'root' })(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
}));
