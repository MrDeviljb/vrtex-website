"use client";

import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string | Date;
  prefix?: string;
  onExpire?: () => void;
  className?: string;
}

export default function CountdownTimer({
  targetDate,
  prefix,
  onExpire,
  className = "",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: string;
    minutes: string;
    seconds: string;
    isExpired: boolean;
  }>({
    hours: "00",
    minutes: "00",
    seconds: "00",
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({
          hours: "00",
          minutes: "00",
          seconds: "00",
          isExpired: true,
        });
        if (onExpire) onExpire();
        return;
      }

      const totalHours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        hours: String(totalHours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
        isExpired: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return <span className={`font-mono text-neon-green ${className}`}>RELEASED / LIVE</span>;
  }

  return (
    <span className={`font-mono font-bold tracking-wider ${className}`}>
      {prefix && <span className="text-gray-400 font-sans font-normal text-xs mr-1.5">{prefix}</span>}
      <span className="text-white bg-surface-light px-1.5 py-0.5 rounded border border-border">
        {timeLeft.hours}h
      </span>{" "}
      <span className="text-white bg-surface-light px-1.5 py-0.5 rounded border border-border">
        {timeLeft.minutes}m
      </span>{" "}
      <span className="text-neon-green bg-surface-light px-1.5 py-0.5 rounded border border-neon-green/30">
        {timeLeft.seconds}s
      </span>
    </span>
  );
}
