import { useEffect, useRef, useState } from 'react';
import { ScanLine, X } from 'lucide-react';

export function ScannerField({
  label,
  hint,
  placeholder = 'Scan or type…',
  expected,
  onSubmit,
  autoFocus = true,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  expected?: string;
  onSubmit: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <form className="scanner-field" onSubmit={submit}>
      <label className="scanner-label" htmlFor="scanner-input">{label}</label>
      <div className="scanner-input-wrap">
        <ScanLine className="scanner-icon" size={22} />
        <input
          id="scanner-input"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="scanner-input"
        />
        {value && (
          <button
            type="button"
            className="scanner-clear"
            onClick={() => { setValue(''); inputRef.current?.focus(); }}
            aria-label="Clear"
          >
            <X size={18} />
          </button>
        )}
      </div>
      {expected && (
        <div className="scanner-expected">
          Expecting: <code>{expected}</code>
        </div>
      )}
      {hint && <div className="scanner-hint">{hint}</div>}
      <button type="submit" className="btn-primary scanner-submit" disabled={!value.trim()}>
        Submit
      </button>
    </form>
  );
}
