import { describe, it, expect, vi } from 'vitest';
import { sseManager } from '../utils/sseManager';
import { Request, Response } from 'express';

describe('SSEManager', () => {
  it('registers and removes a client', () => {
    const mockReq = {
      on: vi.fn(),
    } as unknown as Request;

    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as unknown as Response;

    const clientId = sseManager.addClient('test-room', 'user-1', mockReq, mockRes);
    expect(clientId).toBeDefined();

    sseManager.removeClient(clientId);
  });

  it('broadcasts event to room clients', () => {
    const writtenData: string[] = [];
    const mockReq = {
      on: vi.fn(),
    } as unknown as Request;

    const mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn((data: string) => {
        writtenData.push(data);
        return true;
      }),
      end: vi.fn(),
      on: vi.fn(),
    } as unknown as Response;

    const clientId = sseManager.addClient('room-123', 'user-2', mockReq, mockRes);

    sseManager.broadcast('room-123', 'test_event', { hello: 'world' });

    expect(writtenData.some(d => d.includes('event: test_event') && d.includes('"hello":"world"'))).toBe(true);

    sseManager.removeClient(clientId);
  });
});
