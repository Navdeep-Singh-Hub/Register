import { useEffect, useState } from "react";

function getRemaining(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { total: diff, days, hours, minutes, seconds };
}

export function useCountdown(targetIso: string) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetIso));

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(getRemaining(targetIso));
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  return remaining;
}
