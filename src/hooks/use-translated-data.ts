'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { translateText } from '@/lib/translate';

// Field names that should never be translated (IDs, codes, system fields)
const SKIP_KEYS = new Set([
  'id', 'uid', 'userid', 'docid', 'orderdocid', 'orderid', 'vendorid', 'customerid',
  'serviceid', 'categoryid', 'subcategoryid', 'departmentid', 'invoiceid', 'paymentid',
  'email', 'phonenumber', 'phone', 'mobile', 'whatsapp', 'whatsappnumber',
  'createdat', 'updatedat', 'paidat', 'lastupdated', 'lastlyactive', 'assignedat',
  'profileimageurl', 'attachmenturl', 'imageurl', 'crdocurl', 'cpdocurl', 'eiddocurl', 'moudocurl',
  'password', 'authnumber', 'transactionnumber', 'bankcardnumber',
  'totalprice', 'baseprice', 'amount', 'commissionpercent', 'vendoramount', 'percentage',
  'processingservices', 'completedservices', 'ordercount',
  'type', 'status', 'paymentstatus', 'orderstatus', 'documentstatus',
  'permissions', 'month',
]);

function isTranslatableString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  // Skip pure numbers, codes, ids
  if (/^[\d\s.,+\-:/()#]+$/.test(v)) return false;
  // Skip emails
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return false;
  // Skip URLs
  if (/^https?:\/\//.test(v)) return false;
  // Skip ISO dates
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return false;
  // Skip very long strings (likely doc IDs, hashes, base64)
  if (v.length > 500) return false;
  // Skip if it looks like a Firestore doc ID (alphanumeric, no spaces, length ~20)
  if (v.length >= 18 && v.length <= 28 && /^[A-Za-z0-9_-]+$/.test(v) && !/\s/.test(v)) return false;
  return true;
}

function collectTranslatable(value: any, out: Set<string>) {
  if (value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) collectTranslatable(item, out);
    return;
  }
  if (typeof value === 'object') {
    for (const k of Object.keys(value)) {
      if (SKIP_KEYS.has(k.toLowerCase())) continue;
      collectTranslatable(value[k], out);
    }
    return;
  }
  if (isTranslatableString(value)) out.add(value.trim());
}

function applyTranslations(value: any, map: Map<string, string>): any {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((v) => applyTranslations(v, map));
  if (typeof value === 'object') {
    const out: any = Array.isArray(value) ? [] : {};
    for (const k of Object.keys(value)) {
      if (SKIP_KEYS.has(k.toLowerCase())) {
        out[k] = value[k];
      } else {
        out[k] = applyTranslations(value[k], map);
      }
    }
    return out;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (map.has(trimmed)) return map.get(trimmed)!;
  }
  return value;
}

export function useTranslatedData<T>(data: T): T {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState<T>(data);
  const lastDataRef = useRef<T>(data);

  useEffect(() => {
    lastDataRef.current = data;
    if (language === 'en') {
      setTranslated(data);
      return;
    }

    let cancelled = false;
    const strings = new Set<string>();
    collectTranslatable(data, strings);

    if (strings.size === 0) {
      setTranslated(data);
      return;
    }

    setTranslated(data); // show originals immediately

    Promise.all(
      Array.from(strings).map(async (s) => {
        const t = await translateText(s, language);
        return [s, t] as const;
      })
    ).then((entries) => {
      if (cancelled || lastDataRef.current !== data) return;
      const map = new Map(entries);
      setTranslated(applyTranslations(data, map));
    });

    return () => {
      cancelled = true;
    };
  }, [data, language]);

  return translated;
}
