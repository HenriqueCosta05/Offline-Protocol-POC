import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { createI18n } from '@/i18n';
import { makeStore, type RootState } from '@/store';
import en from '../../public/locales/en/common.json';

const i18n = await createI18n({ en: { common: en } });

export function renderWithProviders(ui: ReactElement, preloadedState?: Partial<RootState>) {
  const store = makeStore(preloadedState);
  const utils = render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </Provider>,
  );
  return { store, ...utils };
}
