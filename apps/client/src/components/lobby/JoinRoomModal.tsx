'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSocketStore } from '../../store/socketStore';
import { useRoomStore } from '../../store/roomStore';
import { GameRoom } from '../../types/room';
import { useRouter } from 'next/navigation';
import { Hash, Lock, Clipboard, ArrowRight } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export function JoinRoomModal({ isOpen, onClose, initialCode = '' }: JoinRoomModalProps) {
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  
  useEffect(() => {
    if (initialCode) setCode(initialCode.toUpperCase());
  }, [initialCode]);

  const { socket } = useSocketStore();
  const { setCurrentRoom } = useRoomStore();
  const router = useRouter();
  
  const handleJoin = () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) { setError('Please enter a 6-character room code'); return; }
    if (cleanCode.length < 4) { setError('Room code is too short'); return; }
    if (!socket) { setError('Connection lost. Please reconnect.'); return; }
    
    setLoading(true);
    setError('');
    
    socket.emit('join_room', { code: cleanCode, password: password || undefined });
    
    socket.once('room_joined', ({ room }: { room: GameRoom }) => {
      setCurrentRoom(room);
      setLoading(false);
      onClose();
      router.push(`/room/${room.code}`);
    });
    
    socket.once('error_message', ({ message }: { message: string }) => {
      setError(message);
      setLoading(false);
      if (message.toLowerCase().includes('password')) setNeedsPassword(true);
    });
    
    setTimeout(() => setLoading(false), 6000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text.trim().slice(0, 6).toUpperCase());
        setError('');
      }
    } catch {
      // ignore
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Game Room" size="sm">
      <div className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            {error}
          </motion.div>
        )}
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white/70 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              Room Code
            </label>
            <button
              type="button"
              onClick={handlePaste}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors font-medium"
            >
              <Clipboard className="w-3 h-3" />
              Paste from clipboard
            </button>
          </div>
          
          <div className="relative">
            <input
              value={code}
              onChange={e => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="e.g. A9B2X1"
              maxLength={6}
              autoFocus
              className="w-full bg-slate-900/90 border border-white/10 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 placeholder-white/20 uppercase tracking-[0.3em] font-mono text-center text-2xl font-black transition-all shadow-inner"
            />
          </div>
          <p className="text-[11px] text-white/40 mt-1.5 text-center">
            Ask the room host for their 6-character room code
          </p>
        </div>
        
        <AnimatePresence>
          {(needsPassword || password) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-1.5"
            >
              <label className="text-white/70 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Password Required
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter room password..."
                className="w-full bg-slate-900/90 border border-amber-500/30 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 placeholder-white/25 text-sm"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            glow
            className="flex-1 font-bold text-base flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
            loading={loading}
            disabled={code.trim().length === 0}
            onClick={handleJoin}
          >
            <span>Enter Room</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
