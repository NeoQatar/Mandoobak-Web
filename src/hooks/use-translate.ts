'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { translateText } from '@/lib/translate';

export function useTranslate(text: string | undefined | null): string {
  const { language } = useLanguage();
  const safeText = text || '';
  const [translated, setTranslated] = useState(safeText);

  useEffect(() => {
    if (!safeText) {
      setTranslated('');
      return;
    }
    if (language === 'en') {
      setTranslated(safeText);
      return;
    }
    let cancelled = false;
    setTranslated(safeText);
    translateText(safeText, language).then((result) => {
      if (!cancelled) setTranslated(result);
    });
    return () => {
      cancelled = true;
    };
  }, [safeText, language]);

  return translated;
}
