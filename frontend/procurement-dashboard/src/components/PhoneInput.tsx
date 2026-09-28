import { COUNTRY_CODES, parsePhone, formatPhone } from '../lib/country-codes';

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  placeholder?: string;
}

export function PhoneInput({ value, onChange, placeholder = '712345678' }: PhoneInputProps) {
  const { dial, local } = parsePhone(value);

  const handleDialChange = (newDial: string) => {
    onChange(formatPhone(newDial, local));
  };

  const handleLocalChange = (newLocal: string) => {
    onChange(formatPhone(dial, newLocal));
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <select
        value={dial}
        onChange={(e) => handleDialChange(e.target.value)}
        style={{ width: 'auto', minWidth: 130 }}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.iso} value={c.dial}>
            {c.flag} {c.dial} ({c.iso})
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        value={local}
        onChange={(e) => handleLocalChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1 }}
      />
    </div>
  );
}
