import { Button, TextField } from '@mui/material';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ComposerForm } from './Composer.style';

export interface ComposerProps {
  draft: string;
  disabled: boolean;
  onChange: (draft: string) => void;
  onSend: () => void;
}

export function Composer({ draft, disabled, onChange, onSend }: ComposerProps) {
  const { t } = useTranslation();
  const canSend = !disabled && draft.trim().length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (canSend) onSend();
  };

  return (
    <ComposerForm as="form" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        size="small"
        autoComplete="off"
        value={draft}
        disabled={disabled}
        placeholder={t('composer.placeholder')}
        onChange={(event) => onChange(event.target.value)}
        slotProps={{ htmlInput: { 'aria-label': t('composer.label') } }}
      />
      <Button type="submit" variant="contained" disabled={!canSend}>
        {t('composer.send')}
      </Button>
    </ComposerForm>
  );
}
