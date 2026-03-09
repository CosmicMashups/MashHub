/**
 * FloatingTextarea: Flutter/Material-style floating label for textarea.
 * Same label behavior as FloatingInput: label inside when empty, floats on focus/fill.
 */
import { useState, useId } from 'react';
import './floating-input.css';

export interface FloatingTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  success?: boolean;
}

export function FloatingTextarea({
  label,
  error,
  helperText,
  id: idProp,
  icon,
  success = false,
  value,
  onFocus,
  onBlur,
  disabled,
  placeholder,
  ...rest
}: FloatingTextareaProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [focused, setFocused] = useState(false);
  const hasValue = value != null && String(value).trim() !== '';
  const floated = focused || hasValue;

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setFocused(false);
    onBlur?.(e);
  };

  const rootClasses = [
    'floating-input-root',
    error && 'floating-input-root--error',
    success && !error && 'floating-input-root--success',
    disabled && 'floating-input-root--disabled',
    icon && 'floating-input-root--has-icon',
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
        <label
          htmlFor={id}
          className={`floating-input-label ${
            floated ? 'floating-input-label--floated' : 'floating-input-label--inside'
          }`}
        >
          {label}
        </label>
        <div className="floating-input-field-wrap">
          <textarea
          id={id}
          className="floating-input-field floating-textarea-field"
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : (helperText && floated) ? `${id}-helper` : undefined
          }
          placeholder={floated ? placeholder : ''}
          {...rest}
        />
      </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="floating-input-error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && floated && (
        <p id={`${id}-helper`} className="floating-input-helper">
          {helperText}
        </p>
      )}
    </div>
  );
}
