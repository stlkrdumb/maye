/**
 * Section label component for the home page.
 * Provides consistent styling for section headers.
 */

import { motion } from "framer-motion";
import { itemVariants } from "@/lib/constants";

export function SectionLabel({ children }: { children: string }) {
  return (
    <motion.div 
      variants={itemVariants}
      className="flex items-center gap-4 mb-8"
    >
      <div className="h-px w-8 bg-gradient-to-r from-[var(--color-sage-dark)] to-transparent opacity-40" />
      <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-[var(--ink-muted)] opacity-70 font-medium">
        {children}
      </span>
    </motion.div>
  );
}
