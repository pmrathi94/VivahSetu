import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export async function createGuestController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId, name, email, phone, relation } = req.body;

    const { data, error } = await supabase
      .from('guests')
      .insert({
        wedding_id: weddingId,
        name,
        email,
        phone,
        relation
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

export async function getGuestsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId } = req.query;

    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('wedding_id', weddingId);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function updateGuestController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('guests')
      .update(req.body)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json(data[0]);
  } catch (error) {
    next(error);
  }
}

export async function deleteGuestController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    next(error);
  }
}
