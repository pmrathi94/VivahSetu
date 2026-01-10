import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export async function createFunctionController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId, name, date, location, type } = req.body;

    const { data, error } = await supabase
      .from('functions')
      .insert({
        wedding_id: weddingId,
        name,
        date,
        location,
        type
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

export async function getFunctionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId } = req.query;

    const { data, error } = await supabase
      .from('functions')
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

export async function updateFunctionController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('functions')
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

export async function deleteFunctionController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('functions')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Function deleted successfully' });
  } catch (error) {
    next(error);
  }
}
