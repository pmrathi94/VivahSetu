// ============================================================================
// VIVAHSETU 2026 - PACKING, AI, & POST-WEDDING WORKFLOWS CONTROLLER
// Features: Function-specific packing, AI suggestions, GDPR-safe toggles,
// Export/delete workflows, email reminders
// ============================================================================

import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest, auditLogger } from '../middleware/rbac';

const router = Router();

// ============================================================================
// PACKING LIST ENDPOINTS
// ============================================================================

/**
 * Create packing list for function or honeymoon
 */
router.post('/:wedding_id/packing', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const { function_id, honeymoon_toggle = false, items = [] } = req.body;

    const { data, error } = await supabase
      .from('packing_list')
      .insert({
        wedding_id,
        function_id,
        list_owner_id: req.user?.id,
        items_json: items,
        honeymoon_toggle,
        assistance_enabled: true,
      })
      .select()
      .single();

    if (error) throw error;

    await auditLogger(req, 'packing_list', 'create', data.list_id, undefined, data);

    res.json({ success: true, packing_list: data });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create packing list' });
  }
});

/**
 * Get packing list for function
 */
router.get('/:wedding_id/packing/:list_id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, list_id } = req.params;

    const { data, error } = await supabase
      .from('packing_list')
      .select('*')
      .eq('list_id', list_id)
      .eq('wedding_id', wedding_id)
      .single();

    if (error) throw error;

    const items = data?.items_json || [];
    const completed = items.filter((i: any) => i.completed).length;
    const completionPercentage = items.length > 0 ? (completed / items.length) * 100 : 0;

    res.json({
      packing_list: data,
      completion_percentage: completionPercentage,
      items: items,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packing list' });
  }
});

/**
 * Update packing list items and progress
 */
router.put('/:wedding_id/packing/:list_id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, list_id } = req.params;
    const { items, assistance_enabled } = req.body;

    const completed = items.filter((i: any) => i.completed).length;
    const completionPercentage = items.length > 0 ? (completed / items.length) * 100 : 0;

    const { data, error } = await supabase
      .from('packing_list')
      .update({
        items_json: items,
        assistance_enabled,
        completion_percentage: Math.round(completionPercentage),
      })
      .eq('list_id', list_id)
      .eq('wedding_id', wedding_id)
      .select()
      .single();

    if (error) throw error;

    await auditLogger(req, 'packing_list', 'update', list_id, undefined, data);

    res.json({ success: true, packing_list: data });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update packing list' });
  }
});

/**
 * Export packing list as PDF/Excel
 */
router.get('/:wedding_id/packing/:list_id/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, list_id } = req.params;
    const { format = 'pdf' } = req.query;

    const { data: packingList } = await supabase
      .from('packing_list')
      .select('*')
      .eq('list_id', list_id)
      .single();

    if (!packingList) {
      return res.status(404).json({ error: 'Packing list not found' });
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      format,
      items: packingList.items_json || [],
      completion: packingList.completion_percentage,
    };

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export packing list' });
  }
});

// ============================================================================
// AI SUGGESTIONS ENDPOINTS (GDPR-SAFE)
// ============================================================================

/**
 * Get AI suggestions (Bride/Groom only, toggleable)
 */
router.get('/:wedding_id/ai/suggestions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const { feature_type } = req.query; // vendor, menu, costume, packing, budget

    // Check if user is Bride/Groom
    const { data: user } = await supabase
      .from('users')
      .select('roles(role_name)')
      .eq('user_id', req.user?.id)
      .single();

    const userRole = (user as any)?.roles?.role_name;

    if (userRole !== 'bride_groom') {
      return res.status(403).json({ error: 'AI features are only for Bride/Groom' });
    }

    // Check if AI toggle is enabled
    const { data: aiToggle } = await supabase
      .from('ai_toggle')
      .select('*')
      .eq('wedding_id', wedding_id)
      .eq('feature_name', feature_type || 'all')
      .single();

    if (!aiToggle?.enabled) {
      return res.status(403).json({ error: 'AI feature is disabled for this wedding' });
    }

    // Generate mock AI suggestions
    const suggestions = generateAISuggestions(feature_type as string);

    res.json({
      feature: feature_type,
      suggestions,
      disclaimer: 'AI suggestions are recommendations. Please verify with experts.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI suggestions' });
  }
});

/**
 * Toggle AI feature (Bride/Groom only)
 */
router.put('/:wedding_id/ai/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const { feature_name, enabled } = req.body;

    // Check if user is Bride/Groom
    const { data: user } = await supabase
      .from('users')
      .select('roles(role_name)')
      .eq('user_id', req.user?.id)
      .single();

    const userRole = (user as any)?.roles?.role_name;

    if (userRole !== 'bride_groom') {
      return res.status(403).json({ error: 'Only Bride/Groom can toggle AI' });
    }

    const { data, error } = await supabase
      .from('ai_toggle')
      .upsert(
        {
          wedding_id,
          feature_name,
          enabled,
          bride_groom_only: true,
        },
        { onConflict: 'wedding_id,feature_name' }
      )
      .select()
      .single();

    if (error) throw error;

    await auditLogger(req, 'ai_toggle', 'update', wedding_id, undefined, data);

    res.json({ success: true, ai_toggle: data });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update AI toggle' });
  }
});

/**
 * Generate mock AI suggestions
 */
const generateAISuggestions = (featureType: string): any[] => {
  const suggestions: Record<string, any[]> = {
    vendor: [
      { type: 'photographer', name: 'Studio ABC', rating: 4.8, speciality: 'Indian weddings' },
      { type: 'catering', name: 'Culinary Delight', rating: 4.6, speciality: 'North Indian' },
    ],
    menu: [
      { dish: 'Biryani', cost: 200, serves: 20 },
      { dish: 'Tandoori Chicken', cost: 150, serves: 20 },
    ],
    costume: [
      { type: 'Lehenga', color: 'Red with gold', designer: 'Local artisan' },
      { type: 'Sherwani', color: 'Cream with maroon', designer: 'Local tailor' },
    ],
    packing: [
      { item: 'Mehndi dress', category: 'Clothes' },
      { item: 'Haldi turmeric paste', category: 'Skincare' },
    ],
    budget: [
      { category: 'Catering', suggested: 50000 },
      { category: 'Decoration', suggested: 30000 },
    ],
  };

  return suggestions[featureType] || [];
};

// ============================================================================
// POST-WEDDING WORKFLOWS
// ============================================================================

/**
 * Schedule post-wedding export and deletion
 */
router.post('/:wedding_id/post-wedding/schedule-deletion', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const delayMonths = 2; // Auto-delete after 2 months

    const deletionDate = new Date();
    deletionDate.setMonth(deletionDate.getMonth() + delayMonths);

    const { data, error } = await supabase
      .from('weddings')
      .update({
        wedding_date_for_deletion: deletionDate.toISOString(),
        status: 'completed',
      })
      .eq('wedding_id', wedding_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      wedding: data,
      deletion_scheduled: deletionDate,
      message: `Wedding data will be deleted on ${deletionDate.toDateString()}`,
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to schedule deletion' });
  }
});

/**
 * Export wedding data (PDF/Excel) before deletion
 */
router.get('/:wedding_id/post-wedding/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const { format = 'pdf' } = req.query; // pdf or excel

    // Fetch all wedding data
    const [
      { data: wedding },
      { data: functions },
      { data: guests },
      { data: media },
      { data: budgets },
    ] = await Promise.all([
      supabase.from('weddings').select('*').eq('wedding_id', wedding_id).single(),
      supabase.from('functions').select('*').eq('wedding_id', wedding_id),
      supabase.from('rsvp').select('*').eq('wedding_id', wedding_id),
      supabase.from('media_studio').select('*').eq('wedding_id', wedding_id),
      supabase.from('budget').select('*').eq('wedding_id', wedding_id),
    ]);

    const exportData = {
      wedding,
      functions_count: functions?.length || 0,
      guests_count: guests?.length || 0,
      media_count: media?.length || 0,
      total_budget: budgets?.reduce((s, b) => s + (b.actual_cost || 0), 0) || 0,
      exported_at: new Date().toISOString(),
      format,
    };

    res.json({
      success: true,
      export: exportData,
      download_url: `/api/weddings/${wedding_id}/export-file`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export wedding data' });
  }
});

/**
 * Send pre-deletion email reminders (called by cron job)
 */
router.post('/:wedding_id/post-wedding/send-reminders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    const { data: wedding } = await supabase
      .from('weddings')
      .select('*')
      .eq('wedding_id', wedding_id)
      .single();

    if (!wedding?.wedding_date_for_deletion) {
      return res.json({ message: 'No deletion scheduled' });
    }

    const now = new Date();
    const deletionDate = new Date(wedding.wedding_date_for_deletion);
    const daysUntilDeletion = Math.ceil(
      (deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let reminderSent = false;

    // Send first reminder at 15 days before deletion
    if (daysUntilDeletion === 15 && !wedding.deletion_reminder_sent) {
      const { data: users } = await supabase
        .from('users')
        .select('email')
        .eq('wedding_id', wedding_id);

      for (const user of users || []) {
        // TODO: Send email to user.email
        console.log(`Reminder email queued to ${user.email}`);
      }

      reminderSent = true;
    }

    // Send final reminder at 1 day before deletion
    if (daysUntilDeletion === 1) {
      const { data: users } = await supabase
        .from('users')
        .select('email')
        .eq('wedding_id', wedding_id);

      for (const user of users || []) {
        // TODO: Send final email to user.email
        console.log(`Final reminder email queued to ${user.email}`);
      }

      reminderSent = true;
    }

    // Auto-delete if past deletion date
    if (daysUntilDeletion <= 0) {
      await supabase.from('weddings').update({ status: 'deleted' }).eq('wedding_id', wedding_id);
      // TODO: Purge associated data
    }

    res.json({
      success: true,
      days_until_deletion: Math.max(0, daysUntilDeletion),
      reminder_sent: reminderSent,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reminders' });
  }
});

/**
 * Get post-wedding status
 */
router.get('/:wedding_id/post-wedding/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    const { data: wedding } = await supabase
      .from('weddings')
      .select('*')
      .eq('wedding_id', wedding_id)
      .single();

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    if (!wedding.wedding_date_for_deletion) {
      return res.json({
        status: 'active',
        message: 'Wedding is active',
      });
    }

    const now = new Date();
    const deletionDate = new Date(wedding.wedding_date_for_deletion);
    const daysUntilDeletion = Math.ceil(
      (deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      status: wedding.status,
      deletion_scheduled: deletionDate,
      days_until_deletion: Math.max(0, daysUntilDeletion),
      can_export: true,
      reminders_sent: wedding.deletion_reminder_sent,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post-wedding status' });
  }
});

export default router;
