import { useLanguageStore } from '../store/useLanguageStore';
import { en } from './en';
import { ar } from './ar';

const translations = { en, ar } as const;
type Lang = keyof typeof translations;
type Dict = typeof en;

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const lang: Lang = useLanguageStore.getState?.()?.language ?? 'en';
  const dict: Dict = translations[lang] ?? en;
  let val = getNestedValue(dict, key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(`{${k}}`, String(v));
    }
  }
  return val;
}
