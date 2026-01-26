import { Request, Response } from 'express';

/**
 * Simple health check endpoint to verify server status.
 */
export const healthCheck = (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", service: "nexus-ai-gateway" });
};
