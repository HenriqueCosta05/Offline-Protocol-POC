import { createTheme } from '@mui/material/styles';

/** Light/dark follow the system setting through MUI's CSS-variables color schemes. */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'media' },
  colorSchemes: { light: true, dark: true },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
});
