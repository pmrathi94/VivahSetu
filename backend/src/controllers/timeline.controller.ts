// ============================================================================
// VIVAHSETU 2026 - TIMELINE & NOTIFICATIONS CONTROLLER
// Features: Visual timeline, countdown timers, notifications, emergency alerts
// ============================================================================

import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest, auditLogger } from '../middleware/rbac';

const router = Router();

/**
 * Get visual timeline with countdown
 */
router.get('/:wedding_id/timeline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    const { data: wedding } = await supabase
      .from('weddings')
      .select('*')
      .eq('wedding_id', wedding_id)
      .single();

    const { data: functions } = await supabase
      .from('functions')
      .select('*')
      .eq('wedding_id', wedding_id)
      .order('scheduled_date', { ascending: true });

    if (!wedding || !functions) {
      return res.status(404).json({ error: 'Wedding or functions not found' });
    }

    const now = new Date();
    const weddingDate = new Date(wedding.wedding_date);
    const daysUntilWedding = Math.ceil(
      (weddingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const timeline = functions.map((f) => {
      const funcDate = new Date(f.scheduled_date);
      const daysUntilFunc = Math.ceil(
        (funcDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let status = f.status;
      if (status === 'pending' && daysUntilFunc < 0) {
        status = 'overdue';
      } else if (status === 'pending' && daysUntilFunc === 0) {
        status = 'today';
      }

      return {
        function_id: f.function_id,
        name: f.function_name,
        type: f.function_type,
        date: f.scheduled_date,
        time: f.scheduled_time,
        venue: f.venue_name,
        status,
        countdown: {
          days: daysUntilFunc,
          isToday: daysUntilFunc === 0,
          isOverdue: daysUntilFunc < 0,
        },
        color_code: getStatusColor(status),
      };
    });

    res.json({
      wedding_date: wedding.wedding_date,
      wedding_name: wedding.wedding_name,
      days_until_wedding: daysUntilWedding,
      total_functions: functions.length,
      timeline,
      completion_stats: {
        completed: functions.filter((f) => f.status === 'completed').length,
        pending: functions.filter((f) => f.status === 'pending').length,
        overdue: functions.filter((f) => f.status === 'overdue').length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

/**
 * Get status color for timeline
 */
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    completed: '#10b981', // green
    pending: '#f59e0b', // amber
    overdue: '#ef4444', // red
    today: '#3b82f6', // blue
    cancelled: '#6b7280', // gray
  };
  return colors[status] || '#9ca3af';
};

/**
 * Create notification
 */
router.post('/:wedding_id/notifications', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const { user_id, notification_type, content, sent_via = 'in_app' } = req.body;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        wedding_id,
        user_id,
        notification_type,
        content,
        sent_via,
      })
      .select()
      .single();

    if (error) throw error;

    // If email or push, trigger external service
    if (sent_via === 'email') {
      // TODO: Integrate with email service (SendGrid, SES, etc.)
      console.log(`Email notification queued: ${content}`);
    } else if (sent_via === 'push') {
      // TODO: Integrate with push notification service
      console.log(`Push notification queued: ${content}`);
    }

    await auditLogger(req, 'notifications', 'create', data.notif_id, undefined, data);

    res.json({ success: true, notification: data });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create notification' });
  }
});

/**
 * Get notifications for user
 */
router.get('/:wedding_id/notifications', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const { unread_only = false } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('wedding_id', wedding_id)
      .eq('user_id', req.user?.id);

    if (unread_only === 'true') {
      query = query.eq('read_status', false);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      total: data?.length || 0,
      notifications: data || [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * Mark notification as read
 */
router.put('/:wedding_id/notifications/:notif_id/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, notif_id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('notif_id', notif_id)
      .eq('wedding_id', wedding_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Failed to mark as read' });
  }
});

/**
 * Emergency alerts for budget/vendor/functions
 */
router.post('/:wedding_id/emergency-alerts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    const alerts = [];

    // Check budget limits
    const { data: budgets } = await supabase
      .from('budget')
      .select('*')
      .eq('wedding_id', wedding_id);

    if (budgets) {
      const totalEstimated = budgets.reduce((s, b) => s + (b.estimated_cost || 0), 0);
      const totalActual = budgets.reduce((s, b) => s + (b.actual_cost || 0), 0);

      if (totalActual > totalEstimated * 0.9) {
        alerts.push({
          type: 'budget_limit_exceeded',
          severity: 'high',
          message: `Budget 90% exceeded. Spent: ₹${totalActual}, Estimated: ₹${totalEstimated}`,
        });
      }
    }

    // Check overdue functions
    const now = new Date();
    const { data: overdueFunctions } = await supabase
      .from('functions')
      .select('*')
      .eq('wedding_id', wedding_id)
      .eq('status', 'overdue')
      .lt('scheduled_date', now.toISOString());

    if (overdueFunctions && overdueFunctions.length > 0) {
      alerts.push({
        type: 'overdue_functions',
        severity: 'medium',
        message: `${overdueFunctions.length} functions are overdue`,
        functions: overdueFunctions.map((f) => f.function_name),
      });
    }

    // Check vendor availability
    const { data: vendors } = await supabase
      .from('vendors')
      .select('*')
      .eq('wedding_id', wedding_id)
      .neq('payment_status', 'paid');

    if (vendors && vendors.length > 0) {
      alerts.push({
        type: 'vendor_payment_pending',
        severity: 'medium',
        message: `${vendors.length} vendors awaiting payment`,
      });
    }

    // Notify users of emergency alerts
    if (alerts.length > 0) {
      const { data: weddingUsers } = await supabase
        .from('users')
        .select('user_id')
        .eq('wedding_id', wedding_id);

      for (const alert of alerts) {
        for (const user of weddingUsers || []) {
          await supabase
            .from('notifications')
            .insert({
              wedding_id,
              user_id: user.user_id,
              notification_type: 'emergency_alert',
              content: alert.message,
              sent_via: 'in_app',
            });
        }
      }
    }

    res.json({
      alert_count: alerts.length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check emergency alerts' });
  }
});

/**
 * Send overdue reminders
 */
router.post('/:wedding_id/reminders/overdue', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    const { data: functions } = await supabase
      .from('functions')
      .select('*')
      .eq('wedding_id', wedding_id)
      .eq('status', 'pending');

    const now = new Date();
    const overdueReminders = [];

    for (const func of functions || []) {
      const funcDate = new Date(func.scheduled_date);
      if (funcDate < now) {
        overdueReminders.push({
          function_id: func.function_id,
          function_name: func.function_name,
          days_overdue: Math.floor(
            (now.getTime() - funcDate.getTime()) / (1000 * 60 * 60 * 24)
          ),
        });
      }
    }

    // Send reminders to wedding admin
    if (overdueReminders.length > 0) {
      const { data: admins } = await supabase
        .from('users')
        .select('user_id')
        .eq('wedding_id', wedding_id)
        .in('role_id', [
          'bride_groom',
          'wedding_admin',
        ]);

      for (const admin of admins || []) {
        await supabase
          .from('notifications')
          .insert({
            wedding_id,
            user_id: admin.user_id,
            notification_type: 'overdue_reminder',
            content: `${overdueReminders.length} functions are overdue`,
            sent_via: 'email',
          });
      }
    }

    res.json({
      reminders_sent: overdueReminders.length,
      reminders: overdueReminders,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

export default router;
