/**
 * FloatingPasswordInput: password field with floating label and visibility toggle.
 * Optionally shows strength indicator. Uses FloatingInput with a trailing toggle button.
 */
import { useState, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FloatingInput } from './FloatingInput';
import './floating-input.css';

export interface FloatingPasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label: string;
  error?: string;
  helperText?: string;
  id?: string;
  icon?: React.ReactNode;
  showStrength?: boolean;
  success?: boolean;
}

function getStrength(value: string): { score: number; label: string } {
  if (!value) return { score: 0, label: '' };
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  return { score: Math.min(score, 5), label: labels[score] };
}

export function FloatingPasswordInput({
  label,
  error,
  helperText,
  id: idProp,
  icon,
  showStrength = false,
  success = false,
  value = '',
  ...props
}: FloatingPasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const strength = useMemo(
    () => getStrength(typeof value === 'string' ? value : ''),
    [value]
  );

  const toggle = (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      className="p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-state-focus)]"
      style={{
        color: 'var(--theme-text-muted)',
      }}
      aria-label={visible ? 'Hide password' : 'Show password'}
      tabIndex={-1}
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <div>
      <FloatingInput
        id={idProp}
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        error={error}
        helperText={helperText}
        icon={icon}
        success={success}
        trailing={toggle}
        {...props}
      />
      {showStrength && strength.label && (
        <div className="flex items-center gap-2 mt-1">
          <div className="flex gap-0.5 flex-1 max-w-[120px]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= strength.score
                    ? i <= 2
                      ? 'bg-red-500'
                      : i <= 4
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-[var(--theme-text-muted)]">{strength.label}</span>
        </div>
      )}
    </div>
  );
}
