import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface BubbleProps {
  outgoing: boolean;
}

export const BubbleRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'outgoing',
})<BubbleProps>(({ outgoing }) => ({
  display: 'flex',
  justifyContent: outgoing ? 'flex-end' : 'flex-start',
}));

export const Bubble = styled(Box, {
  name: 'MessageBubble',
  slot: 'root',
  shouldForwardProp: (prop) => prop !== 'outgoing',
})<BubbleProps>(({ theme, outgoing }) => {
  const { palette } = theme.vars ?? theme;
  return {
    maxWidth: '75%',
    padding: theme.spacing(1, 1.5),
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    alignItems: 'flex-end',
    backgroundColor: outgoing ? palette.primary.main : palette.action.selected,
    color: outgoing ? palette.primary.contrastText : palette.text.primary,
  };
});
