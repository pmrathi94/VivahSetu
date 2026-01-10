import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export async function createWeddingController(req: Request, res: Response, next: NextFunction) {
  try {
    const { brideName, groomName, weddingDate, location, theme, guestCount } = req.body;
    const userId = (req as any).userId;

    const { data, error } = await supabase
      .from('weddings')
      .insert({
        bride_name: brideName,
        groom_name: groomName,
        wedding_date: weddingDate,
        location,
        theme,
        guest_count: guestCount,
        user_id: userId
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

export async function getWeddingsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;

    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getWeddingByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function updateWeddingController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const { data, error } = await supabase
      .from('weddings')
      .update(req.body)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json(data[0]);
  } catch (error) {
    next(error);
  }
}

export async function deleteWeddingController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const { error } = await supabase
      .from('weddings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Wedding deleted successfully' });
  } catch (error) {
    next(error);
  }
}
