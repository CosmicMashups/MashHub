/**
 * Login page: split-screen layout with email/password and optional magic link.
 * Icons on labels and button.
 */
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import {
  AuthLayout,
  AuthCard,
  AuthInput,
  PasswordInput,
  AuthButton,
  FormError,
  FormSuccess,
} from '../components/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const { signIn, signInWithMagicLink } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkMode, setMagicLinkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    if (!EMAIL_REGEX.test(value)) return 'Invalid email address';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emailErr = validateEmail(email);
    setEmailError(emailErr);
    if (emailErr) return;
    if (!magicLinkMode && !password.trim()) {
      setError('Password is required');
      return;
    }
    setSubmitting(true);
    try {
      if (magicLinkMode) {
        const { error: err } = await signInWithMagicLink(email);
        if (err) setError(err);
        else setMagicLinkSent(true);
      } else {
        const { error: err } = await signIn(email, password);
        if (err) setError(err);
        else navigate(redirectTo, { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Enter your credentials to continue.">
      <AuthCard>
        {magicLinkSent ? (
          <FormSuccess message="Check your email for the magic link to sign in." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
            {!magicLinkMode && (
              <PasswordInput
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={undefined}
                autoComplete="current-password"
                icon={<Lock size={16} />}
                required
                disabled={submitting}
              />
            )}
            {error && <FormError message={error} />}
            <AuthButton type="submit" loading={submitting} disabled={submitting} icon={<LogIn size={18} />}>
              {magicLinkMode ? 'Send magic link' : 'Sign in'}
            </AuthButton>
            <button
              type="button"
              onClick={() => {
                setMagicLinkMode((m) => !m);
                setError(null);
              }}
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-music-electric dark:hover:text-music-electric transition-colors py-1"
            >
              {magicLinkMode ? 'Use password instead' : 'Use magic link instead'}
            </button>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-music-electric hover:underline"
              >
                Register
              </Link>
            </p>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
