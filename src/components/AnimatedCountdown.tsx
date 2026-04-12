"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AnimatedCountdownProps {
  targetDate: Date;
  onExpired?: () => void;
}

export default function AnimatedCountdown({ targetDate, onExpired }: AnimatedCountdownProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((targetDate.getTime() - now) / 1000));
      setRemaining(diff);

      if (diff <= 0 && onExpired) {
        onExpired();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpired]);

  const pad = (num: number) => num.toString().padStart(2, "0");
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <div className="flex items-center gap-1">
      {[pad(hours), pad(minutes), pad(seconds)].map((v, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="bg-white text-red-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm"
        >
          {v}
        </motion.span>
      ))}
    </div>
  );
}