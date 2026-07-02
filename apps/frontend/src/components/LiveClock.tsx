'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LiveClockProps {
  className?: string;
  showDate?: boolean;
  iconSize?: number;
}

export default function LiveClock({ className = '', showDate = false, iconSize = 13 }: LiveClockProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Clock size={iconSize} className="shrink-0 opacity-70" />
      <div className="flex flex-col leading-none">
        <span className="font-mono font-semibold tabular-nums">
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </span>
        {showDate && (
          <span className="opacity-60 mt-0.5">
            {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
