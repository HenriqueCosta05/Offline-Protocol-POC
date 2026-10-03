import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { App } from './App';
import { createI18n } from './i18n';
import { makeStore } from './store';
import { loadPersisted, persistStore } from './utils/persist';

async function bootstrap() {
  if (import.meta.env.PUBLIC_MOCK_BRIDGE === 'true') {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({ onUnhandledRequest: 'bypass' });
    } catch (error) {
      // Mocking is a dev convenience: render the app (showing "bridge offline") rather than a blank page.
      console.warn('Could not start the mock bridge', error);
    }
  }

  const i18n = await createI18n();
  const store = makeStore(loadPersisted());
  persistStore(store);

  const container = document.getElementById('root');
  if (!container) throw new Error('Missing #root element');
  createRoot(container).render(
    <StrictMode>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </Provider>
    </StrictMode>,
  );
}

void bootstrap();
