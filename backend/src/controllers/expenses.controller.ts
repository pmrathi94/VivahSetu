import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export async function createExpenseController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId, category, description, amount, date } = req.body;

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        wedding_id: weddingId,
        category,
        description,
        amount,
        date
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

export async function getExpensesController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId } = req.query;

    const { data, error } = await supabase
      .from('expenses')
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

export async function updateExpenseController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('expenses')
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

export async function deleteExpenseController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getBudgetSummaryController(req: Request, res: Response, next: NextFunction) {
  try {
    const { weddingId } = req.query;

    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('wedding_id', weddingId);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const summary = data.reduce((acc: any, exp: any) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    res.json({ totalBudget: Object.values(summary).reduce((a: any, b: any) => a + b, 0), summary });
  } catch (error) {
    next(error);
  }
}
