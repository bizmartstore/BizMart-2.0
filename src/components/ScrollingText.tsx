"use client";

import { motion } from "framer-motion";

interface ScrollingTextProps {
  text: string;
  className?: string;
}

export default function ScrollingText({ text, className }: ScrollingTextProps) {
  return (
    <motion.div
      className={`overflow-hidden whitespace-nowrap ${className}`}
      initial={{ x: "100%" }}
      animate={{ x: "-100%" }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
    >
      <motion.span
        className="inline-block text-sm font-bold text-primary"
      >
        {text} &nbsp;&nbsp;&nbsp; {text} &nbsp;&nbsp;&nbsp; {text} &nbsp;&nbsp;&nbsp;
      </motion.span>
    </motion.div>
  );
}