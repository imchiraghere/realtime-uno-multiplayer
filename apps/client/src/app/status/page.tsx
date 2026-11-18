'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { SERVER_URL, WS_URL } from '../../lib/constants';
import { io as createSocket, Socket } from 'socket.io-client';
import {
  Server,
  Database,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Activity,
  ExternalLink,
  Layers,
  Cpu,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  services?: {
    server: string;
    database: string;
    redis: string;
  };
}

export default function StatusPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [httpStatus, setHttpStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [httpLatency, setHttpLatency] = useState<number | null>(null);
  const [httpError, setHttpError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  const [wsStatus, setWsStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [wsLatency, setWsLatency] = useState<number | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);

  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const runDiagnostics = useCallback(async () => {
    setLoading(true);
    setHttpError(null);
    setWsError(null);

    // 1. Check HTTP Backend
    const httpStart = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${SERVER_URL}/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      const elapsed = Math.round(performance.now() - httpStart);
      setHttpLatency(elapsed);

      if (res.ok) {
        const data = (await res.json()) as HealthResponse;
        setHealthData(data);
        setHttpStatus('online');
      } else {
        setHttpStatus('offline');
        setHttpError(`Server responded with HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      setHttpStatus('offline');
      const message = err instanceof Error ? err.message : 'Failed to reach server';
      setHttpError(message.includes('abort') ? 'Connection timed out (8s limit)' : message);
      setHealthData(null);
    }

    // 2. Check WebSocket (Socket.IO) connection
    const wsStart = performance.now();
    try {
      let testSocket: Socket | null = null;
      let resolved = false;

      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            setWsStatus('offline');
            setWsError('WebSocket handshake timed out (8s limit)');
            if (testSocket) testSocket.disconnect();
            resolve();
          }
        }, 8000);

        try {
          testSocket = createSocket(WS_URL, {
            transports: ['websocket', 'polling'],
            timeout: 7000,
            reconnection: false,
            autoConnect: true,
          });

          testSocket.on('connect', () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              setWsLatency(Math.round(performance.now() - wsStart));
              setWsStatus('online');
              if (testSocket) testSocket.disconnect();
              resolve();
            }
          });

          // In Socket.IO, if server requires auth, connect_error fires with "Authentication required",
          // which actually proves the server is ALIVE and reachable!
          testSocket.on('connect_error', (error) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              const elapsed = Math.round(performance.now() - wsStart);
              setWsLatency(elapsed);
              if (error.message.includes('Authentication') || error.message.includes('token')) {
                // Server responded with auth challenge -> server is definitely running!
                setWsStatus('online');
              } else {
                setWsStatus('offline');
                setWsError(error.message || 'Connection failed');
              }
              if (testSocket) testSocket.disconnect();
              resolve();
            }
          });
        } catch (e: unknown) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            setWsStatus('offline');
            setWsError(e instanceof Error ? e.message : 'Socket error');
            resolve();
          }
        }
      });
    } catch {
      setWsStatus('offline');
      setWsError('Failed to establish WebSocket connection');
    }

    setLastChecked(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      runDiagnostics();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, runDiagnostics]);

  const isAllGood =
    httpStatus === 'online' &&
    wsStatus === 'online' &&
    healthData?.services?.database === 'connected';

  const isDegraded =
    httpStatus === 'online' &&
    (wsStatus === 'offline' || healthData?.services?.database !== 'connected');

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-red-500/30 selection:text-red-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <Activity className="w-6 h-6 text-red-500 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Backend System Status
              </h1>
            </div>
            <p className="text-neutral-400 text-sm">
              Live diagnostics for HTTP API, WebSockets, Database, and Cache.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5',
                autoRefresh
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              Auto-refresh (15s): {autoRefresh ? 'ON' : 'OFF'}
            </button>

            <Button
              variant="secondary"
              size="sm"
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin text-red-400')} />
              <span>{loading ? 'Testing...' : 'Retest Now'}</span>
            </Button>
          </div>
        </div>

        {/* Big Overall Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'p-6 rounded-3xl border mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all',
            isAllGood
              ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
              : isDegraded
              ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5'
              : 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/5'
          )}
        >
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={clsx(
                'w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0',
                isAllGood
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : isDegraded
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              )}
            >
              {isAllGood ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : isDegraded ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <XCircle className="w-7 h-7" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                {isAllGood
                  ? 'All Systems Operational'
                  : isDegraded
                  ? 'Partially Degraded Performance'
                  : 'Backend Server Offline or Unreachable'}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 mt-0.5">
                {isAllGood
                  ? 'HTTP API, WebSocket engine, and Database are communicating normally.'
                  : isDegraded
                  ? 'HTTP API is reachable, but one or more sub-services require attention.'
                  : 'The client cannot connect to the configured backend URL.'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-neutral-400 block">Last Check</span>
            <span className="text-xs font-mono font-bold text-neutral-200">
              {lastChecked ? lastChecked.toLocaleTimeString() : 'Checking...'}
            </span>
          </div>
        </motion.div>

        {/* 4 Core Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Card 1: HTTP Server */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Express HTTP REST API</h3>
                  <span className="text-[11px] text-neutral-400 font-mono truncate block max-w-[200px] sm:max-w-[280px]">
                    {SERVER_URL}/health
                  </span>
                </div>
              </div>

              <span
                className={clsx(
                  'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5',
                  httpStatus === 'online'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : httpStatus === 'checking'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                )}
              >
                <span
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    httpStatus === 'online'
                      ? 'bg-emerald-400'
                      : httpStatus === 'checking'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-red-400'
                  )}
                />
                {httpStatus}
              </span>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
              <span>Response Latency:</span>
              <span className="font-mono font-bold text-white">
                {httpLatency !== null ? `${httpLatency} ms` : '—'}
              </span>
            </div>

            {httpError && (
              <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {httpError}
              </div>
            )}
          </div>

          {/* Card 2: WebSocket Server */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {wsStatus === 'online' ? (
                    <Wifi className="w-5 h-5" />
                  ) : (
                    <WifiOff className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Socket.IO Real-time Engine</h3>
                  <span className="text-[11px] text-neutral-400 font-mono truncate block max-w-[200px] sm:max-w-[280px]">
                    {WS_URL}
                  </span>
                </div>
              </div>

              <span
                className={clsx(
                  'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5',
                  wsStatus === 'online'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : wsStatus === 'checking'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                )}
              >
                <span
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    wsStatus === 'online'
                      ? 'bg-emerald-400'
                      : wsStatus === 'checking'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-red-400'
                  )}
                />
                {wsStatus}
              </span>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
              <span>Handshake Latency:</span>
              <span className="font-mono font-bold text-white">
                {wsLatency !== null ? `${wsLatency} ms` : '—'}
              </span>
            </div>

            {wsError && (
              <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {wsError}
              </div>
            )}
          </div>

          {/* Card 3: PostgreSQL Database */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">PostgreSQL Database</h3>
                  <span className="text-[11px] text-neutral-400">Prisma Client ORM</span>
                </div>
              </div>

              <span
                className={clsx(
                  'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5',
                  healthData?.services?.database === 'connected'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : httpStatus === 'offline'
                    ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                )}
              >
                <span
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    healthData?.services?.database === 'connected'
                      ? 'bg-emerald-400'
                      : httpStatus === 'offline'
                      ? 'bg-neutral-500'
                      : 'bg-red-400'
                  )}
                />
                {healthData?.services?.database || (httpStatus === 'offline' ? 'unknown' : 'disconnected')}
              </span>
            </div>

            <div className="pt-3 border-t border-white/5 text-xs text-neutral-400 flex items-center justify-between">
              <span>Stores:</span>
              <span className="text-neutral-300">Users, Rooms, Match Histories, Badges</span>
            </div>
          </div>

          {/* Card 4: Redis Cache */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Redis Cache & Pub/Sub</h3>
                  <span className="text-[11px] text-neutral-400">ioredis Client</span>
                </div>
              </div>

              <span
                className={clsx(
                  'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5',
                  healthData?.services?.redis === 'connected'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : httpStatus === 'offline'
                    ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                )}
              >
                <span
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    healthData?.services?.redis === 'connected'
                      ? 'bg-emerald-400'
                      : httpStatus === 'offline'
                      ? 'bg-neutral-500'
                      : 'bg-amber-400'
                  )}
                />
                {healthData?.services?.redis || (httpStatus === 'offline' ? 'unknown' : 'disconnected')}
              </span>
            </div>

            <div className="pt-3 border-t border-white/5 text-xs text-neutral-400 flex items-center justify-between">
              <span>Stores:</span>
              <span className="text-neutral-300">Live Game State (`game:roomId`), Fast TTL</span>
            </div>
          </div>
        </div>

        {/* Server Metadata & System Details */}
        <div className="p-6 rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur-md mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
              System Configuration & Metadata
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-neutral-400 block mb-1">Server Uptime</span>
              <span className="font-mono font-bold text-white text-sm">
                {healthData?.uptime !== undefined ? formatUptime(healthData.uptime) : '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-neutral-400 block mb-1">Environment</span>
              <span className="font-mono font-bold text-white text-sm capitalize">
                {healthData?.environment || 'unknown'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-neutral-400 block mb-1">HTTP Endpoint</span>
              <a
                href={`${SERVER_URL}/health`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-red-400 hover:text-red-300 flex items-center gap-1 font-bold truncate"
              >
                <span>/health</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-neutral-400 block mb-1">Client Origin</span>
              <span className="font-mono text-neutral-300 truncate block">
                {typeof window !== 'undefined' ? window.location.origin : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Troubleshooting Guide */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900/80 to-neutral-900/30 border border-white/10">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <span>Troubleshooting & Common Fixes</span>
          </h3>

          <ul className="space-y-3 text-xs text-neutral-300">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-white">Render Free Tier Sleeping:</strong> If your backend is
                hosted on Render free tier, it spins down after 15 minutes of inactivity. The first
                request may take 30 to 50 seconds to wake up. Wait a minute and click &ldquo;Retest
                Now&rdquo;.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-white">Vercel Environment Variables:</strong> Ensure{' '}
                <code className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">
                  NEXT_PUBLIC_SERVER_URL
                </code>{' '}
                and{' '}
                <code className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">
                  NEXT_PUBLIC_WS_URL
                </code>{' '}
                are set to your backend domain (e.g.{' '}
                <code className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">
                  https://your-server.onrender.com
                </code>
                ) in your Vercel Project Settings &gt; Environment Variables.
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-white">Database Credentials:</strong> If the database shows
                disconnected, make sure you ran{' '}
                <code className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">
                  npx prisma db push
                </code>{' '}
                and that your cloud database URL includes{' '}
                <code className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">
                  ?sslmode=require
                </code>
                .
              </div>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
