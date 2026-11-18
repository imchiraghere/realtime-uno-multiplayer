'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);
  
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 25 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative w-full ${sizes[size]} bg-neutral-950/95 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden`}
          >
            {/* Top ambient highlight */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 opacity-80" />

            {title && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-white/40 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
