/**
 * PasswordInput: password field with floating label, visibility toggle, and optional strength indicator.
 * Delegates to FloatingPasswordInput for Flutter/Material-style floating label behavior.
 */
import { FloatingPasswordInput } from '../inputs/FloatingPasswordInput';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label: string;
  error?: string;
  id?: string;
  showStrength?: boolean;
  icon?: React.ReactNode;
}

export function PasswordInput(props: PasswordInputProps) {
  return <FloatingPasswordInput {...props} />;
}
