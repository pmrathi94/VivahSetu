import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing authorization token' });
    }

    const token = authHeader.substring(7);

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    (req as any).userId = data.user.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
}

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error'
  });
}
