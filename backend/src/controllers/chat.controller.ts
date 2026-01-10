import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export async function sendMessageController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId, text } = req.body;
    const userId = (req as any).userId;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        wedding_id: weddingId,
        sender_id: userId,
        text
      })
      .select();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    next(error);
  }
}

export async function getMessagesController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId, limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json(data.reverse());
  } catch (error) {
    next(error);
  }
}

export async function deleteMessageController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', id)
      .eq('sender_id', userId);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
}
