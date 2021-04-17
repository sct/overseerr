import { TranslateIcon } from '@heroicons/react/solid';
import React, { useContext, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import {
  AvailableLocales,
  LanguageContext,
} from '../../../context/LanguageContext';
import useClickOutside from '../../../hooks/useClickOutside';
import Transition from '../../Transition';

const messages = defineMessages({
  changelanguage: 'Change Language',
});

type AvailableLanguageObject = Record<
  string,
  { code: AvailableLocales; display: string }
>;

const availableLanguages: AvailableLanguageObject = {
  ca: {
    code: 'ca',
    display: 'Català',
  },
  de: {
    code: 'de',
    display: 'Deutsch',
  },
  en: {
    code: 'en',
    display: 'English',
  },
  es: {
    code: 'es',
    display: 'Español',
  },
  fr: {
    code: 'fr',
    display: 'Français',
  },
  it: {
    code: 'it',
    display: 'Italiano',
  },
  hu: {
    code: 'hu',
    display: 'Magyar',
  },
  nl: {
    code: 'nl',
    display: 'Nederlands',
  },
  'nb-NO': {
    code: 'nb-NO',
    display: 'Norsk Bokmål',
  },
  'pt-BR': {
    code: 'pt-BR',
    display: 'Português (Brasil)',
  },
  'pt-PT': {
    code: 'pt-PT',
    display: 'Português (Portugal)',
  },
  sv: {
    code: 'sv',
    display: 'Svenska',
  },
  ru: {
    code: 'ru',
    display: 'pусский',
  },
  sr: {
    code: 'sr',
    display: 'српски језик‬',
  },
  ja: {
    code: 'ja',
    display: '日本語',
  },
  'zh-TW': {
    code: 'zh-TW',
    display: '中文（臺灣）',
  },
};

const LanguagePicker: React.FC = () => {
  const intl = useIntl();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale } = useContext(LanguageContext);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  useClickOutside(dropdownRef, () => setDropdownOpen(false));

  return (
    <div className="relative">
      <div>
        <button
          className={`p-1 rounded-full sm:p-2 hover:bg-gray-600 hover:text-white focus:outline-none focus:bg-gray-600 focus:ring-1 focus:ring-gray-500 focus:text-white ${
            isDropdownOpen ? 'bg-gray-600 text-white' : 'text-gray-400'
          }`}
          aria-label="Language Picker"
          onClick={() => setDropdownOpen(true)}
        >
          <TranslateIcon className="w-6 h-6" />
        </button>
      </div>
      <Transition
        show={isDropdownOpen}
        enter="transition ease-out duration-100 opacity-0"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75 opacity-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div
          className="absolute right-0 w-56 mt-2 origin-top-right rounded-md shadow-lg"
          ref={dropdownRef}
        >
          <div className="px-3 py-2 bg-gray-700 rounded-md ring-1 ring-black ring-opacity-5">
            <div>
              <label
                htmlFor="language"
                className="block pb-2 text-sm font-medium leading-5 text-gray-300"
              >
                {intl.formatMessage(messages.changelanguage)}
              </label>
              <select
                id="language"
                className="rounded-md"
                onChange={(e) =>
                  setLocale && setLocale(e.target.value as AvailableLocales)
                }
                onBlur={(e) =>
                  setLocale && setLocale(e.target.value as AvailableLocales)
                }
                defaultValue={locale}
              >
                {(Object.keys(
                  availableLanguages
                ) as (keyof typeof availableLanguages)[]).map((key) => (
                  <option key={key} value={availableLanguages[key].code}>
                    {availableLanguages[key].display}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default LanguagePicker;
