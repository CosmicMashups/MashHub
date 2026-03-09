/**
 * FloatingInput: Flutter/Material-style floating label text input.
 * Label sits inside when empty; on focus or when filled, label animates up and shrinks
 * to sit on the top border. Uses theme tokens and GPU-friendly animations (transform, opacity).
 *
 * Animation logic: "Floated" state is true when the input has focus OR a non-empty value.
 * The label switches between two CSS classes (--inside vs --floated). CSS handles the
 * transition: inside = translateY(-50%) full size; floated = translateY(calc(-50% - 1.25rem)) scale(0.75).
 * Only transform and font-size are animated (220ms cubic-bezier(0.4,0,0.2,1)) for performance.
 */
import { forwardRef, useState, useId } from 'react';
import './floating-input.css';

export interface FloatingInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  success?: boolean;
  /** Rendered inside the field (e.g. password visibility toggle); positioned absolute right */
  trailing?: React.ReactNode;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    {
      label,
      error,
      helperText,
      id: idProp,
      icon,
      success = false,
      trailing,
      value,
      onFocus,
      onBlur,
      disabled,
      placeholder,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const [focused, setFocused] = useState(false);
    const hasValue =
      value != null && String(value).trim() !== '';
    const floated = focused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    };

    const rootClasses = [
      'floating-input-root',
      error && 'floating-input-root--error',
      success && !error && 'floating-input-root--success',
      disabled && 'floating-input-root--disabled',
      icon && 'floating-input-root--has-icon',
      trailing && 'floating-input-root--has-trailing',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={rootClasses}>
        <div className="floating-input-field-container">
          {icon && <span className="floating-input-icon" aria-hidden>{icon}</span>}
          <label
            htmlFor={id}
            className={`floating-input-label ${floated ? 'floating-input-label--floated' : 'floating-input-label--inside'}`}
          >
            {label}
          </label>
          <div className="floating-input-field-wrap">
            <input
              ref={ref}
              id={id}
              className="floating-input-field"
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
            {trailing && <span className="floating-input-trailing">{trailing}</span>}
          </div>
        </div>
        {error && (
          <p
            id={`${id}-error`}
            className="floating-input-error"
            role="alert"
          >
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

FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
