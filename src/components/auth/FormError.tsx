/**
 * FormError: inline error message with role="alert".
 */
import { motion } from 'framer-motion';

interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm text-red-600 dark:text-red-400"
      role="alert"
    >
      {message}
    </motion.p>
  );
}
