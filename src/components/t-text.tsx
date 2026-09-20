'use client';

import { useTranslate } from '@/hooks/use-translate';

export function TText({ text }: { text: string | undefined | null }) {
  const translated = useTranslate(text);
  return <>{translated}</>;
}
