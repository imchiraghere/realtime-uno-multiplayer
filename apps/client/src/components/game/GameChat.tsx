'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, X } from 'lucide-react';
import { useSocketStore } from '../../store/socketStore';
import { useAuthStore } from '../../store/authStore';
import { useSounds } from '../../hooks/useSounds';
import { api } from '../../lib/api';
import { subscribeToGameSSE } from '../../lib/sse';
import { clsx } from 'clsx';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  message: string;
  createdAt: string;
}

interface GameChatProps {
  roomId: string;
  currentUserId: string;
  className?: string;
}

const QUICK_EMOTES = ['🔥', '🃏', '🎉', '😂', '👏', '😱', 'GG!'];

export function GameChat({ roomId, currentUserId, className }: GameChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { socket } = useSocketStore();
  const { token } = useAuthStore();
  const { play } = useSounds();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Load initial messages
  useEffect(() => {
    if (!roomId) return;
    api.get<{ success: boolean; data: ChatMessage[] }>(`/api/game/${roomId}/chat`)
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setMessages(res.data);
        }
      })
      .catch(() => {});
  }, [roomId]);

  // Handler for adding message without duplicates
  const handleIncomingMessage = (msg: ChatMessage) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev.slice(-99), msg];
    });
    if (!isOpen) {
      setUnread(u => u + 1);
      play('click');
    }
  };

  // Socket.IO Chat Listener
  useEffect(() => {
    if (!socket) return;
    socket.on('chat_message', handleIncomingMessage);
    return () => {
      socket.off('chat_message', handleIncomingMessage);
    };
  }, [socket, isOpen, play]);

  // Real-Time SSE Chat Listener
  useEffect(() => {
    if (!roomId || !token) return;
    const unsubscribe = subscribeToGameSSE(roomId, token, {
      onChatMessage: (msg) => {
        handleIncomingMessage(msg);
      },
    });
    return () => {
      unsubscribe();
    };
  }, [roomId, token, isOpen, play]);
  
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);
  
  const sendMessage = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;
    play('click');
    
    if (socket && socket.connected) {
      socket.emit('send_chat_message', { roomId, message: text.trim() });
    } else {
      api.post<{ success: boolean; data: ChatMessage }>(`/api/game/${roomId}/chat`, {
        message: text.trim(),
      }).then((res) => {
        if (res?.data) handleIncomingMessage(res.data);
      }).catch(() => {});
    }

    if (!textToSend) setInput('');
  };
  
  return (
    <div className={clsx('fixed bottom-4 right-4 z-40', className)}>
      {/* Floating Chat Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="mb-3 w-80 bg-neutral-950/95 backdrop-blur-xl border border-white/20 rounded-3xl flex flex-col max-h-96 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-bold text-sm">Table Chat</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 max-h-56 no-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-xs">
                  No messages yet. Say hello to players!
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.userId === currentUserId;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={clsx('flex gap-2 items-end', isMe ? 'flex-row-reverse' : 'flex-row')}
                    >
                      <div
                        className={clsx(
                          'max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-md break-words',
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white/15 text-white/95 rounded-bl-sm border border-white/10'
                        )}
                      >
                        {!isMe && (
                          <div className="text-[10px] text-indigo-300 font-bold mb-0.5">{msg.username}</div>
                        )}
                        <span className="leading-relaxed">{msg.message}</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>
            
            {/* Quick Emote Reactions */}
            <div className="flex gap-1.5 px-3 py-2 border-t border-white/10 bg-black/40 overflow-x-auto no-scrollbar">
              {QUICK_EMOTES.map(emote => (
                <button
                  key={emote}
                  onClick={() => sendMessage(emote)}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                >
                  {emote}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="p-2.5 flex items-center gap-2 border-t border-white/10 bg-white/5"
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={200}
                className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-neutral-900/90 hover:bg-neutral-800 border-2 border-white/20 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-center cursor-pointer transition-colors"
      >
        <MessageCircle className="w-5 h-5 text-indigo-400" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 border-2 border-white text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-lg">
            {unread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
