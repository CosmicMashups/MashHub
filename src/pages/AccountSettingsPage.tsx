/**
 * Account Settings page: edit username, change password with 2FA-style flow.
 * Same header and footer as other app pages. Uses Supabase updateUser and reauth via signIn.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, Mail, Shield, ArrowLeft } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { AuthInput } from '../components/auth/AuthInput';
import { PasswordInput } from '../components/auth/PasswordInput';
import { AuthButton } from '../components/auth/AuthButton';
import { FormError, FormSuccess } from '../components/auth';
import { Footer } from '../components/Footer';
import { LegalModal } from '../components/LegalModal';
import { PrimaryLoader } from '../components/loading/PrimaryLoader';
import { AppHeader } from '../components/layout/AppHeader';
import { PRIVACY_POLICY_CONTENT, TERMS_OF_SERVICE_CONTENT } from '../content/legalContent';

const USERNAME_MIN = 2;
const USERNAME_MAX = 64;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function AccountSettingsPage() {
  useTheme();
  const { user, updateUser, signIn } = useAuthContext();
  const [username, setUsername] = useState(
    () => (user?.user_metadata?.username && String(user.user_metadata.username).trim()) || ''
  );
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  useEffect(() => {
    const u = (user?.user_metadata?.username && String(user.user_metadata.username).trim()) || '';
    setUsername(u);
  }, [user]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordConfirm, setCurrentPasswordConfirm] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const validateUsername = (value: string) => {
    if (!value) return 'Username is required';
    if (value.length < USERNAME_MIN) return `Username must be at least ${USERNAME_MIN} characters`;
    if (value.length > USERNAME_MAX) return `Username must be at most ${USERNAME_MAX} characters`;
    if (!USERNAME_REGEX.test(value)) return 'Username can only contain letters, numbers, . _ -';
    return null;
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateUsername(username.trim());
    setUsernameError(err);
    setUsernameSuccess(false);
    if (err) return;
    setUsernameSaving(true);
    try {
      const { error } = await updateUser({ username: username.trim() });
      if (error) {
        setUsernameError(error);
      } else {
        setUsernameSuccess(true);
      }
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleSendVerificationCode = async () => {
    const email = user?.email;
    if (!email) {
      setPasswordError('No email on account.');
      return;
    }
    setPasswordError(null);
    setVerificationSent(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (!currentPassword || !currentPasswordConfirm) {
      setPasswordError('Enter your current password twice.');
      return;
    }
    if (currentPassword !== currentPasswordConfirm) {
      setPasswordError('Current password fields do not match.');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('New password fields do not match.');
      return;
    }
    const email = user?.email;
    if (!email) {
      setPasswordError('No email on account.');
      return;
    }
    setPasswordSubmitting(true);
    try {
      const { error: signInErr } = await signIn(email, currentPassword);
      if (signInErr) {
        setPasswordError('Current password is incorrect.');
        return;
      }
      const { error: updateErr } = await updateUser({ password: newPassword });
      if (updateErr) {
        setPasswordError(updateErr);
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword('');
      setCurrentPasswordConfirm('');
      setVerificationCode('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setVerificationSent(false);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (!user) {
    return <PrimaryLoader label="Loading account settings" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-theme-background-primary transition-all duration-300">
      <AppHeader
        actions={
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-theme-text-secondary transition-colors hover:bg-theme-state-hover hover:text-theme-text-primary"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Library</span>
          </Link>
        }
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="animate-fade-in-up">
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-theme-text-muted">
              <li>
                <Link to="/" className="hover:text-theme-text-primary transition-colors">
                  Library
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-theme-text-primary font-medium" aria-current="page">
                Account Settings
              </li>
            </ol>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-theme-text-primary mb-8">
            Account Settings
          </h1>

          {/* Username section */}
          <section
            className="card p-6 sm:p-8 mb-8"
            aria-labelledby="username-section-title"
          >
            <h2
              id="username-section-title"
              className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-music-electric/10 dark:bg-music-electric/20 text-music-electric">
                <User size={18} />
              </span>
              Profile
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Your display name across MashHub.
            </p>
            <form onSubmit={handleSaveUsername} className="space-y-4">
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
                icon={<User size={16} />}
                disabled={usernameSaving}
                minLength={USERNAME_MIN}
                maxLength={USERNAME_MAX}
                placeholder="Enter username"
              />
              {usernameSuccess && <FormSuccess message="Username saved." />}
              <AuthButton
                type="submit"
                loading={usernameSaving}
                disabled={usernameSaving}
                icon={<User size={18} />}
              >
                Save username
              </AuthButton>
            </form>
          </section>

          {/* Change password section */}
          <section
            className="card p-6 sm:p-8 mb-8"
            aria-labelledby="password-section-title"
          >
            <h2
              id="password-section-title"
              className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-music-electric/10 dark:bg-music-electric/20 text-music-electric">
                <Lock size={18} />
              </span>
              Change password
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Enter your current password twice, then request a verification code sent to your
              registered email. After entering the code, set your new password.
            </p>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-4">
                <PasswordInput
                  label="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  icon={<Lock size={16} />}
                  autoComplete="current-password"
                  disabled={passwordSubmitting}
                />
                <PasswordInput
                  label="Confirm current password"
                  value={currentPasswordConfirm}
                  onChange={(e) => setCurrentPasswordConfirm(e.target.value)}
                  icon={<Lock size={16} />}
                  autoComplete="current-password"
                  disabled={passwordSubmitting}
                />
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail size={16} className="text-music-electric" />
                  Email verification
                </p>
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={passwordSubmitting || verificationSent}
                  className="text-sm text-music-electric hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-music-electric/50 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                >
                  <Mail size={16} />
                  {verificationSent ? 'Verification email sent' : 'Send verification code to your email'}
                </button>
                {verificationSent && (
                  <div className="pt-2">
                    <AuthInput
                      label="Verification code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      icon={<Shield size={16} />}
                      placeholder="Enter code from email"
                      disabled={passwordSubmitting}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <PasswordInput
                  label="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  showStrength
                  icon={<Lock size={16} />}
                  autoComplete="new-password"
                  disabled={passwordSubmitting}
                  minLength={MIN_PASSWORD_LENGTH}
                />
                <PasswordInput
                  label="Confirm new password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  icon={<Lock size={16} />}
                  autoComplete="new-password"
                  disabled={passwordSubmitting}
                />
              </div>

              {passwordError && <FormError message={passwordError} />}
              {passwordSuccess && <FormSuccess message="Password updated." />}
              <AuthButton
                type="submit"
                loading={passwordSubmitting}
                disabled={passwordSubmitting}
                loadingLabel="Updating password..."
                icon={<Lock size={18} />}
              >
                Update password
              </AuthButton>
            </form>
          </section>
        </div>
      </main>

      <Footer onPrivacyClick={() => setShowPrivacyModal(true)} onTermsClick={() => setShowTermsModal(true)} />
      <LegalModal
        isOpen={showPrivacyModal}
        title="Privacy Policy"
        content={PRIVACY_POLICY_CONTENT}
        onClose={() => setShowPrivacyModal(false)}
      />
      <LegalModal
        isOpen={showTermsModal}
        title="Terms of Service"
        content={TERMS_OF_SERVICE_CONTENT}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
}
