/**
 * Register page: Username, Email, Password, Confirm password.
 * Username stored in user_metadata; icons on labels and buttons.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import {
  AuthLayout,
  AuthCard,
  AuthInput,
  PasswordInput,
  AuthButton,
  FormError,
} from '../components/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const USERNAME_MIN = 2;
const USERNAME_MAX = 64;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

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
    return null;
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
      else navigate('/', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Register to start using MashHub.">
      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label="Username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError(validateUsername(e.target.value));
            }}
            onBlur={() => setUsernameError(validateUsername(username))}
            error={usernameError ?? undefined}
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
            showStrength
            icon={<Lock size={16} />}
            required
            disabled={submitting}
            minLength={MIN_PASSWORD_LENGTH}
          />
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
            disabled={submitting}
            loadingLabel="Creating account..."
            icon={<UserPlus size={18} />}
          >
            Create account
          </AuthButton>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-music-electric hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
