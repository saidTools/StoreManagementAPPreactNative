import { create } from 'zustand';
import { I18nManager } from 'react-native';

type Language = 'en' | 'ar';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: (lang: Language) => {
    set({ language: lang });
    if (lang === 'ar' !== I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(lang === 'ar');
    }
  },
}));
