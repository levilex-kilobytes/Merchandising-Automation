export interface Country {
  code: string;
  name: string;
  dial: string;
}

export const COUNTRIES: Country[] = [
  { code: 'KE', name: 'Kenya',        dial: '+254' },
  { code: 'TZ', name: 'Tanzania',     dial: '+255' },
  { code: 'UG', name: 'Uganda',       dial: '+256' },
  { code: 'RW', name: 'Rwanda',       dial: '+250' },
  { code: 'BI', name: 'Burundi',      dial: '+257' },
  { code: 'SS', name: 'South Sudan',  dial: '+211' },
  { code: 'ET', name: 'Ethiopia',     dial: '+251' },
  { code: 'SO', name: 'Somalia',      dial: '+252' },
  { code: 'ZA', name: 'South Africa', dial: '+27' },
  { code: 'NG', name: 'Nigeria',      dial: '+234' },
  { code: 'GH', name: 'Ghana',        dial: '+233' },
  { code: 'EG', name: 'Egypt',        dial: '+20' },
  { code: 'MA', name: 'Morocco',      dial: '+212' },
  { code: 'AE', name: 'UAE',          dial: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { code: 'IN', name: 'India',        dial: '+91' },
  { code: 'CN', name: 'China',        dial: '+86' },
  { code: 'JP', name: 'Japan',        dial: '+81' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'US', name: 'United States',  dial: '+1' },
  { code: 'CA', name: 'Canada',       dial: '+1' },
  { code: 'DE', name: 'Germany',      dial: '+49' },
  { code: 'FR', name: 'France',       dial: '+33' },
  { code: 'NL', name: 'Netherlands',  dial: '+31' },
  { code: 'IT', name: 'Italy',        dial: '+39' },
  { code: 'ES', name: 'Spain',        dial: '+34' },
  { code: 'BR', name: 'Brazil',       dial: '+55' },
  { code: 'AU', name: 'Australia',    dial: '+61' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function CountryCodeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (dial: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Country code"
      style={{
        width: 140,
        minWidth: 140,
        fontFamily: 'SF Mono, Menlo, Consolas, monospace',
        fontWeight: 700,
      }}
    >
      {COUNTRIES.map((c) => (
        <option key={`${c.code}-${c.dial}`} value={c.dial}>
          {c.name} ({c.dial})
        </option>
      ))}
    </select>
  );
}
