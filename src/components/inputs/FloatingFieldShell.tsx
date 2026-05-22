import { useId } from 'react';
import './floating-input.css';

export interface FloatingFieldShellProps {
  label: string;
  icon?: React.ReactNode;
  helperText?: string;
  error?: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

/** Floating label container for custom controls (dropdown triggers, file pickers, etc.). */
export function FloatingFieldShell({
  label,
  icon,
  helperText,
  error,
  id: idProp,
  className = '',
  children,
}: FloatingFieldShellProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const rootClasses = [
    'floating-input-root',
    'floating-input-root--label-floated',
    icon && 'floating-input-root--has-icon',
    error && 'floating-input-root--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      <div className="floating-input-field-container">
        {icon && (
          <span className="floating-input-icon" aria-hidden>
            {icon}
          </span>
        )}
        <label htmlFor={id} className="floating-input-label floating-input-label--floated">
          {label}
        </label>
        <div className="floating-input-field-wrap">{children}</div>
      </div>
      {error && (
        <p id={`${id}-error`} className="floating-input-error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${id}-helper`} className="floating-input-helper">
          {helperText}
        </p>
      )}
    </div>
  );
}
