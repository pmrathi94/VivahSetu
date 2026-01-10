// ============================================================================
// VIVAHSETU 2026 - ANALYTICS DASHBOARD CONTROLLER
// Features: Budget analytics, function completion, RSVP stats, live charts
// ============================================================================

import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/rbac';

const router = Router();

/**
 * Get budget analytics
 */
router.get('/:wedding_id/analytics/budget', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    const { data: budgets } = await supabase
      .from('budget')
      .select('*')
      .eq('wedding_id', wedding_id);

    if (!budgets) {
      return res.json({
        total_budget: 0,
        spent: 0,
        remaining: 0,
        by_category: [],
      });
    }

    const totalBudget = budgets.reduce((sum, b) => sum + (b.estimated_cost || 0), 0);
    const spent = budgets.reduce((sum, b) => sum + (b.actual_cost || 0), 0);
    const remaining = totalBudget - spent;

    // Group by category
    const byCategory = budgets.reduce(
      (acc, b) => {
        const cat = b.category || 'Other';
        if (!acc[cat]) {
          acc[cat] = { estimated: 0, actual: 0, count: 0 };
        }
        acc[cat].estimated += b.estimated_cost || 0;
        acc[cat].actual += b.actual_cost || 0;
        acc[cat].count += 1;
        return acc;
      },
      {} as Record<string, any>
    );

    const budgetByBride = budgets
      .filter((b) => b.budget_owner_id)
      .reduce((acc, b) => {
        const ownerId = b.budget_owner_id;
        if (!acc[ownerId]) {
          acc[ownerId] = { estimated: 0, actual: 0 };
        }
        acc[ownerId].estimated += b.estimated_cost || 0;
        acc[ownerId].actual += b.actual_cost || 0;
        return acc;
      }, {} as Record<string, any>);

    res.json({
      total_budget: totalBudget,
      spent,
      remaining,
      percentage_spent: totalBudget > 0 ? ((spent / totalBudget) * 100).toFixed(1) : 0,
      by_category: byCategory,
      by_bride_groom: budgetByBride,
      payment_status: {
        paid: budgets.filter((b) => b.payment_status === 'paid').length,
        pending: budgets.filter((b) => b.payment_status === 'pending').length,
        partial: budgets.filter((b) => b.payment_status === 'partial').length,
        overdue: budgets.filter((b) => b.payment_status === 'overdue').length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budget analytics' });
  }
});

/**
 * Get function completion statistics
 */
router.get('/:wedding_id/analytics/functions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    const { data: functions } = await supabase
      .from('functions')
      .select('*')
      .eq('wedding_id', wedding_id);

    if (!functions) {
      return res.json({
        total: 0,
        pending: 0,
        completed: 0,
        overdue: 0,
        completion_percentage: 0,
      });
    }

    const total = functions.length;
    const pending = functions.filter((f) => f.status === 'pending').length;
    const completed = functions.filter((f) => f.status === 'completed').length;
    const overdue = functions.filter((f) => f.status === 'overdue').length;

    res.json({
      total,
      pending,
      completed,
      overdue,
      completion_percentage: ((completed / total) * 100).toFixed(1),
      by_type: functions.reduce(
        (acc, f) => {
          const type = f.function_type || 'other';
          if (!acc[type]) {
            acc[type] = { total: 0, completed: 0 };
          }
          acc[type].total += 1;
          if (f.status === 'completed') acc[type].completed += 1;
          return acc;
        },
        {} as Record<string, any>
      ),
      timeline: functions
        .map((f) => ({
          name: f.function_name,
          date: f.scheduled_date,
          status: f.status,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch function analytics' });
  }
});

/**
 * Get RSVP statistics
 */
router.get('/:wedding_id/analytics/rsvp', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    const { data: rsvps } = await supabase
      .from('rsvp')
      .select('*')
      .eq('wedding_id', wedding_id);

    if (!rsvps) {
      return res.json({
        total_invited: 0,
        confirmed: 0,
        declined: 0,
        pending: 0,
        response_rate: 0,
      });
    }

    const total = rsvps.length;
    const confirmed = rsvps.filter((r) => r.rsvp_status === 'yes').length;
    const declined = rsvps.filter((r) => r.rsvp_status === 'no').length;
    const pending = rsvps.filter((r) => r.rsvp_status === 'pending').length;
    const responded = confirmed + declined;

    res.json({
      total_invited: total,
      confirmed,
      declined,
      pending,
      response_rate: total > 0 ? ((responded / total) * 100).toFixed(1) : 0,
      plus_ones: rsvps.reduce((sum, r) => sum + (r.plus_ones || 0), 0),
      by_function: rsvps.reduce(
        (acc, r) => {
          const funcId = r.function_id;
          if (!acc[funcId]) {
            acc[funcId] = { yes: 0, no: 0, maybe: 0, pending: 0 };
          }
          acc[funcId][r.rsvp_status === 'maybe' ? 'maybe' : r.rsvp_status] += 1;
          return acc;
        },
        {} as Record<string, any>
      ),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch RSVP analytics' });
  }
});

/**
 * Get packing completion statistics
 */
router.get('/:wedding_id/analytics/packing', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    const { data: packingLists } = await supabase
      .from('packing_list')
      .select('*')
      .eq('wedding_id', wedding_id);

    if (!packingLists) {
      return res.json({
        total_lists: 0,
        average_completion: 0,
        honeymoon_packing: 0,
      });
    }

    const avgCompletion =
      packingLists.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) /
      packingLists.length;

    const honeymoonLists = packingLists.filter((p) => p.honeymoon_toggle).length;

    res.json({
      total_lists: packingLists.length,
      average_completion: avgCompletion.toFixed(1),
      honeymoon_packing: honeymoonLists,
      by_completion: {
        '0-25%': packingLists.filter((p) => p.completion_percentage <= 25).length,
        '26-50%': packingLists.filter(
          (p) => p.completion_percentage > 25 && p.completion_percentage <= 50
        ).length,
        '51-75%': packingLists.filter(
          (p) => p.completion_percentage > 50 && p.completion_percentage <= 75
        ).length,
        '76-100%': packingLists.filter((p) => p.completion_percentage > 75).length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packing analytics' });
  }
});

/**
 * Get comprehensive wedding dashboard
 */
router.get('/:wedding_id/analytics/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    // Get all analytics
    const [budgetRes, functionsRes, rsvpRes, packingRes] = await Promise.all([
      supabase
        .from('budget')
        .select('*')
        .eq('wedding_id', wedding_id),
      supabase
        .from('functions')
        .select('*')
        .eq('wedding_id', wedding_id),
      supabase
        .from('rsvp')
        .select('*')
        .eq('wedding_id', wedding_id),
      supabase
        .from('packing_list')
        .select('*')
        .eq('wedding_id', wedding_id),
    ]);

    const budget = budgetRes.data || [];
    const functions = functionsRes.data || [];
    const rsvps = rsvpRes.data || [];
    const packing = packingRes.data || [];

    res.json({
      budget: {
        total: budget.reduce((s, b) => s + (b.estimated_cost || 0), 0),
        spent: budget.reduce((s, b) => s + (b.actual_cost || 0), 0),
      },
      functions: {
        total: functions.length,
        completed: functions.filter((f) => f.status === 'completed').length,
      },
      rsvps: {
        confirmed: rsvps.filter((r) => r.rsvp_status === 'yes').length,
        total_invited: rsvps.length,
      },
      packing: {
        average_completion: (
          packing.reduce((s, p) => s + (p.completion_percentage || 0), 0) / packing.length ||
          0
        ).toFixed(1),
      },
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

export default router;
