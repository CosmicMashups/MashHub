/**
 * LoginPrompt: Call-to-action component displayed to unauthenticated users
 * when they attempt to use features that require authentication (e.g., saving projects).
 * 
 * Displays a friendly message with links to login or register.
 */
import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

interface LoginPromptProps {
  /**
   * Custom message to display. Defaults to "Login to save projects"
   */
  message?: string;
  /**
   * Additional CSS classes for styling
   */
  className?: string;
}

export function LoginPrompt({ 
  message = "Login to save projects", 
  className = "" 
}: LoginPromptProps) {
  return (
    <div 
      className={`flex flex-col items-center gap-3 p-6 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
        {message}
      </p>
      <div className="flex gap-3">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-4 py-2 bg-music-electric hover:bg-music-electric/90 text-white font-medium rounded-lg transition-colors"
        >
          <LogIn size={18} />
          Login
        </Link>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-4 py-2 border border-music-electric text-music-electric hover:bg-music-electric/10 font-medium rounded-lg transition-colors"
        >
          <UserPlus size={18} />
          Sign up
        </Link>
      </div>
    </div>
  );
}
