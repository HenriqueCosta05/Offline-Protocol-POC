import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const Shell = styled(Box, { name: 'ChatShell', slot: 'root' })(({ theme }) => ({
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: (theme.vars ?? theme).palette.background.default,
}));

export const Header = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${(theme.vars ?? theme).palette.divider}`,
}));

export const Main = styled(Box)({
  flex: 1,
  minHeight: 0,
  display: 'flex',
});

export const Sidebar = styled(Box, { name: 'ChatSidebar', slot: 'root' })(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${(theme.vars ?? theme).palette.divider}`,
  [theme.breakpoints.down('sm')]: { width: 120 },
}));

export const ThreadPane = styled(Box, { name: 'ChatThreadPane', slot: 'root' })({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
});
