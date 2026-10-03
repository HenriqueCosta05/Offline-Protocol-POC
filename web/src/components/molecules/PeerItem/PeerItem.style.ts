import { ListItemButton } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PeerButton = styled(ListItemButton, { name: 'PeerItem', slot: 'root' })(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  gap: theme.spacing(1),
}));
