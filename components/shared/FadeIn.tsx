"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function FadeIn({ 
  children, 
  delay = 0 
}: { 
  children: ReactNode; 
  delay?: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}