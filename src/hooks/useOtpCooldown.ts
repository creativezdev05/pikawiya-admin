// hooks/useOtpCooldown.ts
"use client";

import { useEffect, useState } from "react";

export function useOtpCooldown(initialSeconds: number = 60) {
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const startCooldown = () => setCooldown(initialSeconds);

  return { cooldown, startCooldown, canResend: cooldown === 0 };
}