import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PeerListRoot = styled(Box, { name: 'PeerList', slot: 'root' })(({ theme }) => ({
  padding: theme.spacing(1.5),
  overflowY: 'auto',
}));
