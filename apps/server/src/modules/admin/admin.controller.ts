import { Request, Response } from 'express';
import { adminService } from './admin.service';

export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await adminService.getStats();
    res.json({ success: true, data: stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const reports = await adminService.getReports(req.query.status as string);
    res.json({ success: true, data: reports });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function reviewReport(req: Request, res: Response): Promise<void> {
  try {
    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const report = await adminService.reviewReport(reportId, req.body.status);
    res.json({ success: true, data: report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function banUser(req: Request, res: Response): Promise<void> {
  try {
    const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await adminService.banUser(targetUserId, req.body.banned);
    res.json({ success: true, data: user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await adminService.getUsers(req.query.search as string);
    res.json({ success: true, data: users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, error: message });
  }
}
