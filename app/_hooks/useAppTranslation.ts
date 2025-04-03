import { useTranslation } from 'next-i18next';
import { UseTranslationOptions } from 'react-i18next';
import i18n from '../i18n'; // Importa la inicialización

export function useAppTranslation(ns?: string, options?) {
  return useTranslation(ns, { i18n, ...options });
}