import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export async function uploadMediaController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId, title } = req.body;
    const userId = (req as any).userId;
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Mock URL for now - in production, upload to Supabase Storage
    const fileUrl = `https://example.com/media/${file.filename}`;

    const { data, error } = await supabase
      .from('media_studio')
      .insert({
        wedding_id: weddingId,
        user_id: userId,
        title,
        media_url: fileUrl,
        media_type: file.mimetype
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

export async function getMediaController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId } = req.query;

    const { data, error } = await supabase
      .from('media_studio')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function deleteMediaController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('media_studio')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    next(error);
  }
}
