import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ComposerForm = styled(Box, { name: 'Composer', slot: 'root' })(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5),
  borderTop: `1px solid ${(theme.vars ?? theme).palette.divider}`,
}));
