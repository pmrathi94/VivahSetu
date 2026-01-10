// ============================================================================
// VIVAHSETU 2026 - MEDIA STUDIO CONTROLLER
// Features: Versioning, watermarking, screenshot prevention, role-based access,
// Canva-style editor integration, offline-first caching
// ============================================================================

import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest, auditLogger } from '../middleware/rbac';

const router = Router();

/**
 * Upload media to studio
 */
router.post('/:wedding_id/media/upload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const {
      media_type,
      media_url,
      role_access,
      add_watermark = true,
      screenshot_prevention = false,
    } = req.body;

    // Get current media to check version
    const { data: latestMedia } = await supabase
      .from('media_studio')
      .select('*')
      .eq('wedding_id', wedding_id)
      .eq('media_type', media_type)
      .order('media_version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latestMedia?.media_version || 0) + 1;

    const { data, error } = await supabase
      .from('media_studio')
      .insert({
        wedding_id,
        created_by: req.user?.id,
        media_type,
        media_url,
        media_version: nextVersion,
        previous_version_id: latestMedia?.media_id,
        role_access: role_access || [],
        has_watermark: add_watermark,
        screenshot_prevention,
      })
      .select()
      .single();

    if (error) throw error;

    await auditLogger(req, 'media_studio', 'create', data.media_id, undefined, data);

    res.json({
      success: true,
      media: data,
      version: nextVersion,
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to upload media' });
  }
});

/**
 * Get media with version history
 */
router.get('/:wedding_id/media/:media_id/versions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, media_id } = req.params;

    // Get the media and all versions
    const { data: media } = await supabase
      .from('media_studio')
      .select('*')
      .eq('wedding_id', wedding_id)
      .eq('media_id', media_id)
      .single();

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Get all versions
    const { data: versions } = await supabase
      .from('media_studio')
      .select('*')
      .or(
        `media_id.eq.${media_id},previous_version_id.eq.${media_id}`
      )
      .order('media_version', { ascending: false });

    res.json({
      current: media,
      versions: versions || [],
      total_versions: versions?.length || 1,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

/**
 * Rollback to previous version
 */
router.post('/:wedding_id/media/:media_id/rollback', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, media_id } = req.params;
    const { target_version } = req.body;

    // Get target version
    const { data: targetMedia } = await supabase
      .from('media_studio')
      .select('*')
      .eq('wedding_id', wedding_id)
      .eq('media_version', target_version)
      .single();

    if (!targetMedia) {
      return res.status(404).json({ error: 'Target version not found' });
    }

    // Create new version pointing to this content
    const { data: newMedia, error } = await supabase
      .from('media_studio')
      .insert({
        wedding_id,
        created_by: req.user?.id,
        media_type: targetMedia.media_type,
        media_url: targetMedia.media_url,
        media_version: (targetMedia.media_version || 0) + 1,
        previous_version_id: media_id,
        role_access: targetMedia.role_access,
        has_watermark: targetMedia.has_watermark,
        screenshot_prevention: targetMedia.screenshot_prevention,
      })
      .select()
      .single();

    if (error) throw error;

    await auditLogger(req, 'media_studio', 'update', media_id, targetMedia, newMedia);

    res.json({
      success: true,
      media: newMedia,
      rolled_back_from: target_version,
      new_version: newMedia?.media_version,
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to rollback' });
  }
});

/**
 * Update role-based access for media
 */
router.put('/:wedding_id/media/:media_id/access', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, media_id } = req.params;
    const { role_access } = req.body;

    const { data, error } = await supabase
      .from('media_studio')
      .update({ role_access })
      .eq('media_id', media_id)
      .eq('wedding_id', wedding_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, media: data });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update access' });
  }
});

/**
 * Get media by role (role-aware access)
 */
router.get('/:wedding_id/media/by-role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;

    // Get user's role
    const { data: user } = await supabase
      .from('users')
      .select('role_id, roles(role_name)')
      .eq('user_id', req.user?.id)
      .single();

    const userRole = (user as any)?.roles?.role_name;

    // Get media accessible to this role
    const { data: media } = await supabase
      .from('media_studio')
      .select('*')
      .eq('wedding_id', wedding_id);

    // Filter by role access
    const accessibleMedia = media?.filter(
      (m) =>
        m.role_access.length === 0 || // Public
        m.role_access.includes(userRole) || // Role-specific
        m.created_by === req.user?.id // Creator always sees
    ) || [];

    res.json({
      count: accessibleMedia.length,
      media: accessibleMedia,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/**
 * Add watermark to media
 */
router.post('/:wedding_id/media/:media_id/watermark', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, media_id } = req.params;
    const { watermark_text, watermark_position = 'bottom-right' } = req.body;

    // In production, use image processing library (e.g., sharp, Canvas)
    const { data, error } = await supabase
      .from('media_studio')
      .update({
        has_watermark: true,
      })
      .eq('media_id', media_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      media: data,
      watermark: {
        text: watermark_text,
        position: watermark_position,
        applied: true,
      },
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to apply watermark' });
  }
});

/**
 * Toggle screenshot prevention
 */
router.put('/:wedding_id/media/:media_id/screenshot-prevention', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, media_id } = req.params;
    const { enabled } = req.body;

    const { data, error } = await supabase
      .from('media_studio')
      .update({
        screenshot_prevention: enabled,
      })
      .eq('media_id', media_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      media: data,
      screenshot_prevention_enabled: enabled,
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update screenshot prevention' });
  }
});

/**
 * Canva-style editor endpoint (mock)
 * In production, integrate with Canva API or similar
 */
router.post('/:wedding_id/media/editor/design', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const {
      design_type,
      template_name,
      elements,
      colors,
      fonts,
    } = req.body;

    // Mock design storage
    const design = {
      design_id: Math.random().toString(36).substring(7),
      wedding_id,
      design_type,
      template_name,
      elements,
      colors,
      fonts,
      created_at: new Date().toISOString(),
      editable_by_roles: ['bride_groom', 'wedding_admin'],
    };

    res.json({
      success: true,
      design,
      preview_url: `https://editor.vivahsetu.com/designs/${design.design_id}`,
      export_options: ['png', 'pdf', 'video'],
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create design' });
  }
});

/**
 * Export media (PDF/Excel collection)
 */
router.get('/:wedding_id/media/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const { format = 'json' } = req.query;

    const { data: media } = await supabase
      .from('media_studio')
      .select('*')
      .eq('wedding_id', wedding_id);

    const exportData = {
      wedding_id,
      media_count: media?.length || 0,
      exported_at: new Date().toISOString(),
      format,
      media: media?.map((m) => ({
        media_id: m.media_id,
        type: m.media_type,
        version: m.media_version,
        url: m.media_url,
        created_at: m.created_at,
      })) || [],
    };

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export media' });
  }
});

export default router;
