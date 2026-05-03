/**
 * Login page: split-screen layout with email/password and optional magic link.
 * Icons on labels and button.
 */
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, ChevronRight } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
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

export function LoginPage() {
  const { signIn } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
      else navigate(redirectTo, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome Back"
      title="Sign in"
      subtitle="Access your library, projects, and harmonic matching workflow."
    >
      <AuthCard>
          <form onSubmit={handleSubmit} className="space-y-5">
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
              onChange={(e) => setPassword(e.target.value)}
              error={undefined}
              autoComplete="current-password"
              icon={<Lock size={16} />}
              required
              disabled={submitting}
            />
            {error && <FormError message={error} />}
            <AuthButton type="submit" loading={submitting} disabled={submitting} icon={<LogIn size={18} />}>
              Login
            </AuthButton>

            <AuthDivider />
            <p className="text-center text-sm text-theme-text-secondary">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="inline-flex items-center gap-1 font-medium text-theme-accent-primary hover:underline underline-offset-4"
              >
                Create Account
                <ChevronRight size={14} />
              </Link>
            </p>
          </form>
      </AuthCard>
    </AuthLayout>
  );
}
