/**
 * AuthInput: accessible text input with floating label and validation state.
 * Delegates to FloatingInput for Flutter/Material-style floating label behavior.
 */
import { forwardRef } from 'react';
import { FloatingInput } from '../inputs/FloatingInput';

export interface AuthInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  error?: string;
  id?: string;
  icon?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  (props, ref) => {
    return <FloatingInput ref={ref} {...props} />;
  }
);
AuthInput.displayName = 'AuthInput';
