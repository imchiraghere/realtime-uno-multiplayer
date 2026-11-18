import { Request, Response } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema } from './auth.schema';

interface AuthRequest extends Request {
  user?: { userId: string; username: string; isAdmin: boolean };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data.email, data.username, data.password);
    res.status(201).json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ success: false, error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.status(200).json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ success: false, error: message });
  }
}

export async function guest(_req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.createGuestUser();
    res.status(201).json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Guest creation failed';
    res.status(400).json({ success: false, error: message });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const user = await authService.getMe(userId);
    res.json({ success: true, data: user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}
