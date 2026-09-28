export interface CountryCode {
  iso: string;
  name: string;
  dial: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { iso: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { iso: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
  { iso: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
  { iso: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
  { iso: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹' },
  { iso: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { iso: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { iso: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { iso: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { iso: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { iso: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { iso: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { iso: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { iso: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { iso: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { iso: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { iso: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { iso: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
];

export const DEFAULT_COUNTRY_CODE = '+254';

export function parsePhone(full: string | null | undefined): { dial: string; local: string } {
  if (!full) return { dial: DEFAULT_COUNTRY_CODE, local: '' };
  const trimmed = full.trim();
  for (const c of COUNTRY_CODES) {
    if (trimmed.startsWith(c.dial + ' ')) {
      return { dial: c.dial, local: trimmed.slice(c.dial.length + 1) };
    }
    if (trimmed.startsWith(c.dial)) {
      return { dial: c.dial, local: trimmed.slice(c.dial.length) };
    }
  }
  return { dial: DEFAULT_COUNTRY_CODE, local: trimmed };
}

export function formatPhone(dial: string, local: string): string {
  const clean = local.replace(/\s+/g, '').trim();
  if (!clean) return '';
  return `${dial} ${clean}`;
}
