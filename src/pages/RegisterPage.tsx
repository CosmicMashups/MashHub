/**
 * Register page: Username, Email, Password, Confirm password.
 * Username stored in user_metadata; icons on labels and buttons.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  AuthLayout,
  AuthCard,
  AuthInput,
  PasswordInput,
  AuthButton,
  AuthDivider,
  FormError,
} from '../components/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const USERNAME_MIN = 2;
const USERNAME_MAX = 64;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;
const PASSWORD_RULES = {
  upper: /[A-Z]/,
  lower: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

export function RegisterPage() {
  const { signUp } = useAuthContext();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const validateUsername = (value: string) => {
    if (!value) return 'Username is required';
    if (value.length < USERNAME_MIN) return `Username must be at least ${USERNAME_MIN} characters`;
    if (value.length > USERNAME_MAX) return `Username must be at most ${USERNAME_MAX} characters`;
    if (!USERNAME_REGEX.test(value)) return 'Username can only contain letters, numbers, . _ -';
    return null;
  };

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    if (!EMAIL_REGEX.test(value)) return 'Invalid email address';
    return null;
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < MIN_PASSWORD_LENGTH)
      return `Password must contain at least ${MIN_PASSWORD_LENGTH} characters`;
    if (!PASSWORD_RULES.upper.test(value)) return 'Password must include an uppercase letter';
    if (!PASSWORD_RULES.lower.test(value)) return 'Password must include a lowercase letter';
    if (!PASSWORD_RULES.number.test(value)) return 'Password must include a number';
    if (!PASSWORD_RULES.special.test(value)) return 'Password must include a special character';
    return null;
  };

  const checkUsernameAvailability = async (value: string) => {
    const normalized = value.trim();
    const basicError = validateUsername(normalized);
    if (basicError) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', normalized)
        .limit(1);
      if (error) {
        setUsernameAvailable(true);
      } else {
        setUsernameAvailable((data?.length ?? 0) === 0);
      }
    } catch {
      setUsernameAvailable(true);
    } finally {
      setCheckingUsername(false);
    }
  };

  const validateConfirm = (value: string) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const usernameErr = validateUsername(username);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirm(confirmPassword);
    setUsernameError(usernameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmError(confirmErr);
    if (usernameErr || emailErr || passwordErr || confirmErr) return;
    setSubmitting(true);
    try {
      const { error: err } = await signUp(email, password, username.trim());
      if (err) setError(err);
      else navigate('/login', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const passwordRulesPass =
    password.length >= MIN_PASSWORD_LENGTH &&
    PASSWORD_RULES.upper.test(password) &&
    PASSWORD_RULES.lower.test(password) &&
    PASSWORD_RULES.number.test(password) &&
    PASSWORD_RULES.special.test(password);
  const formValid =
    !usernameError &&
    !emailError &&
    !passwordError &&
    !confirmError &&
    !!username &&
    !!email &&
    !!password &&
    !!confirmPassword &&
    usernameAvailable !== false &&
    passwordRulesPass &&
    confirmPassword === password;

  const passwordChecks = [
    { label: `${MIN_PASSWORD_LENGTH}+ chars`, pass: password.length >= MIN_PASSWORD_LENGTH },
    { label: 'Uppercase', pass: PASSWORD_RULES.upper.test(password) },
    { label: 'Lowercase', pass: PASSWORD_RULES.lower.test(password) },
    { label: 'Number', pass: PASSWORD_RULES.number.test(password) },
    { label: 'Special char', pass: PASSWORD_RULES.special.test(password) },
  ];

  const usernameHelper =
    usernameError
      ? undefined
      : checkingUsername
        ? 'Checking username...'
        : usernameAvailable === false
          ? 'Username is not available'
          : usernameAvailable === true
            ? 'Username is available'
            : undefined;

  return (
    <AuthLayout
      compact
      eyebrow="New Account"
      title="Create account"
      subtitle="Set up your MashHub profile."
    >
      <AuthCard compact>
        <form onSubmit={handleSubmit} className="auth-form-compact space-y-2.5">
          <AuthInput
            label="Username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError(validateUsername(e.target.value));
              setUsernameAvailable(null);
            }}
            onBlur={() => {
              setUsernameError(validateUsername(username));
              void checkUsernameAvailability(username);
            }}
            error={usernameError ?? undefined}
            helperText={usernameHelper}
            autoComplete="username"
            icon={<User size={16} />}
            required
            disabled={submitting}
            minLength={USERNAME_MIN}
            maxLength={USERNAME_MAX}
          />
          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(validateEmail(e.target.value));
            }}
            onBlur={() => setEmailError(validateEmail(email))}
            error={emailError ?? undefined}
            autoComplete="email"
            icon={<Mail size={16} />}
            required
            disabled={submitting}
          />
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(validatePassword(e.target.value));
              if (confirmPassword) setConfirmError(validateConfirm(confirmPassword));
            }}
            onBlur={() => setPasswordError(validatePassword(password))}
            error={passwordError ?? undefined}
            autoComplete="new-password"
            icon={<Lock size={16} />}
            required
            disabled={submitting}
            minLength={MIN_PASSWORD_LENGTH}
          />
          {password.length > 0 && (
            <ul className="-mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5" aria-label="Password requirements">
              {passwordChecks.map((check) => (
                <li
                  key={check.label}
                  className={`inline-flex items-center gap-1 text-[11px] leading-tight ${check.pass ? 'text-theme-accent-success' : 'text-theme-text-muted'}`}
                >
                  {check.pass ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                  {check.label}
                </li>
              ))}
            </ul>
          )}
          <PasswordInput
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setConfirmError(validateConfirm(e.target.value));
            }}
            onBlur={() => setConfirmError(validateConfirm(confirmPassword))}
            error={confirmError ?? undefined}
            autoComplete="new-password"
            icon={<Lock size={16} />}
            required
            disabled={submitting}
          />
          {error && <FormError message={error} />}
          <AuthButton
            type="submit"
            loading={submitting}
            disabled={submitting || !formValid || checkingUsername}
            loadingLabel="Creating account..."
            compact
            icon={<UserPlus size={18} />}
          >
            Create Account
          </AuthButton>
          <AuthDivider compact />
          <p className="text-center text-sm text-theme-text-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-medium text-theme-accent-primary hover:underline underline-offset-4"
            >
              Login
              <ChevronRight size={14} />
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
