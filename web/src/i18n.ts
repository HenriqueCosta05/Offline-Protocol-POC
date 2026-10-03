import i18next, { type i18n, type Resource } from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

const base = {
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
};

/** Pass `resources` to bundle strings (tests); omit to load `public/locales` over HTTP. */
export async function createI18n(resources?: Resource): Promise<i18n> {
  const instance = i18next.createInstance();
  if (resources) {
    await instance.use(initReactI18next).init({ ...base, resources });
  } else {
    await instance
      .use(HttpBackend)
      .use(initReactI18next)
      .init({ ...base, backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' } });
  }
  return instance;
}
