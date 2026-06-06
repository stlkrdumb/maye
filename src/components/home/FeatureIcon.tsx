/**
 * Feature icon wrapper for the home page.
 * Provides consistent styling and hover effects for feature icons.
 */

import { motion } from "framer-motion";

export function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.1 }}
      className="relative size-12 rounded-xl bg-gradient-to-br from-[var(--color-sage-light)]/30 to-[var(--color-sage-light)]/10 flex items-center justify-center text-[var(--color-sage-text)] dark:text-[var(--color-sage)] mb-6 shadow-sm border border-[var(--color-sage)]/20 hover:shadow-md hover:border-[var(--color-sage)]/40 transition-all duration-300"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--color-sage)]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <span className="relative z-10">{children}</span>
    </motion.div>
  );
}
