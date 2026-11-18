'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  glow?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  glow = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white border border-indigo-400/40 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50',
    secondary:
      'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm hover:border-white/30',
    danger:
      'bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-500 text-white border border-red-400/40 shadow-lg shadow-red-600/30 hover:shadow-red-500/50',
    ghost:
      'bg-transparent hover:bg-white/10 text-white/80 hover:text-white border border-transparent',
    success:
      'bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 text-white border border-green-400/40 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/50',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-xl font-bold',
    md: 'px-4.5 py-2.5 text-sm rounded-xl font-bold',
    lg: 'px-6 py-3.5 text-base rounded-2xl font-black',
    xl: 'px-8 py-4 text-lg rounded-2xl font-black',
  };
  
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 select-none',
        'transition-all duration-150 cursor-pointer',
        'active:scale-[0.97] hover:-translate-y-0.5',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
        glow && 'ring-2 ring-white/30',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
