/**
 * FloatingSelect: floating-label wrapper for native <select>.
 * Shares the same container, label animation, and state styling as FloatingInput.
 */
import { useState, useId, forwardRef } from 'react';
import './floating-input.css';

export interface FloatingSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  success?: boolean;
}

const FloatingSelect = forwardRef<HTMLSelectElement, FloatingSelectProps>(
  (
    {
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
      children,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const [focused, setFocused] = useState(false);
    const hasValue =
      value != null && String(value) !== '';
    const floated = focused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setFocused(true);
      onFocus?.(e);
    };
    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setFocused(false);
      onBlur?.(e);
    };

    const rootClasses = [
      'floating-input-root',
      error && 'floating-input-root--error',
      success && !error && 'floating-input-root--success',
      disabled && 'floating-input-root--disabled',
      icon && 'floating-input-root--has-icon',
      'floating-input-root--select',
      !floated && 'floating-input-root--select-placeholder-hidden',
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
            <select
              ref={ref}
              id={id}
              className="floating-input-field floating-select-field"
              value={value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={
                error ? `${id}-error` : (helperText && floated) ? `${id}-helper` : undefined
              }
              {...rest}
            >
              {children}
            </select>
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
);

FloatingSelect.displayName = 'FloatingSelect';

export { FloatingSelect };

