import { Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { BridgeStatus } from '@/@types/chat';

const SEVERITY = { connecting: 'info', connected: 'success', disconnected: 'warning' } as const;

export interface ConnectionBannerProps {
  status: BridgeStatus;
  error: string | null;
}

export function ConnectionBanner({ status, error }: ConnectionBannerProps) {
  const { t } = useTranslation();
  return (
    <Alert severity={error ? 'error' : SEVERITY[status]} square>
      {error ?? t(`banner.${status}`)}
    </Alert>
  );
}
