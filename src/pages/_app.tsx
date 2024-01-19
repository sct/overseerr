import Layout from '@app/components/Layout';
import LoadingBar from '@app/components/LoadingBar';
import ServiceWorkerSetup from '@app/components/ServiceWorkerSetup';
import { InteractionProvider } from '@app/context/InteractionContext';
import type { AvailableLocale } from '@app/context/LanguageContext';
import { LanguageContext } from '@app/context/LanguageContext';
import { SettingsProvider } from '@app/context/SettingsContext';
import type { User } from '@app/hooks/useUser';
import '@app/styles/globals.css';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';
import Index from './index';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadLocaleData = (locale: AvailableLocale): Promise<any> => {
  switch (locale) {
    case 'ar':
      return import('../i18n/locale/ar.json');
    case 'ca':
      return import('../i18n/locale/ca.json');
    case 'cs':
      return import('../i18n/locale/cs.json');
    case 'da':
      return import('../i18n/locale/da.json');
    case 'de':
      return import('../i18n/locale/de.json');
    case 'el':
      return import('../i18n/locale/el.json');
    case 'es':
      return import('../i18n/locale/es.json');
    case 'fr':
      return import('../i18n/locale/fr.json');
    case 'hr':
      return import('../i18n/locale/hr.json');
    case 'hu':
      return import('../i18n/locale/hu.json');
    case 'it':
      return import('../i18n/locale/it.json');
    case 'ja':
      return import('../i18n/locale/ja.json');
    case 'lt':
      return import('../i18n/locale/lt.json');
    case 'nb-NO':
      return import('../i18n/locale/nb_NO.json');
    case 'nl':
      return import('../i18n/locale/nl.json');
    case 'pl':
      return import('../i18n/locale/pl.json');
    case 'pt-BR':
      return import('../i18n/locale/pt_BR.json');
    case 'pt-PT':
      return import('../i18n/locale/pt_PT.json');
    case 'ru':
      return import('../i18n/locale/ru.json');
    case 'sq':
      return import('../i18n/locale/sq.json');
    case 'sr':
      return import('../i18n/locale/sr.json');
    case 'sv':
      return import('../i18n/locale/sv.json');
    case 'zh-CN':
      return import('../i18n/locale/zh_Hans.json');
    case 'zh-TW':
      return import('../i18n/locale/zh_Hant.json');
    default:
      return import('../i18n/locale/en.json');
  }
};

// Custom types so we can correctly type our GetInitialProps function
// with our combined user prop
// This is specific to _app.tsx. Other pages will not need to do this!

type MessagesType = Record<string, string>;

interface ExtendedAppProps extends AppProps {
  user: User;
  messages: MessagesType;
  locale: AvailableLocale;
  currentSettings: PublicSettingsResponse;
}

if (typeof window === 'undefined') {
  global.Intl = require('intl');
}

export default function App({
  user,
  currentSettings,
  messages,
  locale,
}: ExtendedAppProps) {
  const [loadedMessages, setMessages] = useState<MessagesType>(messages);
  const [currentLocale, setLocale] = useState<AvailableLocale>(locale);

  useEffect(() => {
    loadLocaleData(currentLocale).then(setMessages);
  }, [currentLocale]);

  return (
    <LanguageContext.Provider value={{ locale: currentLocale, setLocale }}>
      <IntlProvider
        locale={currentLocale}
        defaultLocale="en"
        messages={loadedMessages}
      >
        <LoadingBar />
        <SettingsProvider currentSettings={currentSettings}>
          <InteractionProvider>
            <ServiceWorkerSetup />
            <Layout>
              <Index />
            </Layout>
          </InteractionProvider>
        </SettingsProvider>
      </IntlProvider>
    </LanguageContext.Provider>
  );
}
