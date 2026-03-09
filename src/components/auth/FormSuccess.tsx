/**
 * FormSuccess: success message (e.g. magic link sent).
 */
import { motion } from 'framer-motion';

interface FormSuccessProps {
  message: string;
}

export function FormSuccess({ message }: FormSuccessProps) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm text-green-600 dark:text-green-400"
      role="status"
    >
      {message}
    </motion.p>
  );
}
