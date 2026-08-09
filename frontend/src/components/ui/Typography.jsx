import React from "react";

export function HeadingXL({ className = "", children, ...props }) {
  return (
    <h1 
      className={`font-heading font-bold text-[32px] text-textPrimary tracking-tight leading-tight ${className}`} 
      {...props}
    >
      {children}
    </h1>
  );
}

export function HeadingLG({ className = "", children, ...props }) {
  return (
    <h2 
      className={`font-heading font-bold text-[24px] text-textPrimary tracking-tight leading-tight ${className}`} 
      {...props}
    >
      {children}
    </h2>
  );
}

export function Body({ className = "", children, ...props }) {
  return (
    <p 
      className={`font-sans font-medium text-[14px] text-textSecondary leading-relaxed ${className}`} 
      {...props}
    >
      {children}
    </p>
  );
}

export function Caption({ className = "", children, ...props }) {
  return (
    <span 
      className={`font-sans font-semibold text-[12px] text-textMuted tracking-wider ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
}

export function HeroMetric({ className = "", children, ...props }) {
  return (
    <span 
      className={`font-sans font-extrabold text-[52px] lg:text-[56px] text-textPrimary tracking-tight leading-none ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
}

export function KPIMetric({ className = "", children, ...props }) {
  return (
    <span 
      className={`font-sans font-extrabold text-[38px] lg:text-[40px] text-textPrimary tracking-tight leading-none ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
}

export function CategoryMetric({ className = "", children, ...props }) {
  return (
    <span 
      className={`font-sans font-bold text-[28px] lg:text-[30px] text-textPrimary tracking-tight leading-none ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
}

export function SecondaryMetric({ className = "", children, ...props }) {
  return (
    <span 
      className={`font-sans font-semibold text-[18px] lg:text-[20px] text-textSecondary leading-none ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
}

export function Metric({ className = "", children, ...props }) {
  return <KPIMetric className={className} {...props}>{children}</KPIMetric>;
}

export function MetricSmall({ className = "", children, ...props }) {
  return <SecondaryMetric className={className} {...props}>{children}</SecondaryMetric>;
}
