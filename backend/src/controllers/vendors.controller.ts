// ============================================================================
// VIVAHSETU 2026 - VENDORS & LOCATION CONTROLLER
// Features: OpenStreetMap integration, state→district→city filtering,
// lat/lng caching, function assignment, ratings, feedback, sharing
// ============================================================================

import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest, auditLogger, modulePermissionGuard } from '../middleware/rbac';

const router = Router();

/**
 * Get vendors by location hierarchy
 * Supports filtering by state→district→city→village
 */
router.get('/:wedding_id/vendors/by-location', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const { state, district, city, village, vendor_type } = req.query;

    let query = supabase
      .from('vendors')
      .select('*')
      .eq('wedding_id', wedding_id);

    if (state) query = query.eq('state', state);
    if (district) query = query.eq('district', district);
    if (city) query = query.eq('city', city);
    if (village) query = query.eq('village', village);
    if (vendor_type) query = query.eq('vendor_type', vendor_type);

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) throw error;

    // Include cached location data
    const vendorsWithCache = data?.map((vendor) => ({
      ...vendor,
      location_cached: {
        cached_at: vendor.updated_at,
        coordinates: {
          lat: vendor.location_lat,
          lng: vendor.location_lng,
        },
      },
    })) || [];

    res.json(vendorsWithCache);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

/**
 * Add vendor with OpenStreetMap coordinates
 */
router.post('/:wedding_id/vendors', modulePermissionGuard('manage_vendors'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const {
      vendor_name,
      vendor_type,
      phone,
      email,
      address,
      city,
      state,
      district,
      village,
      location_lat,
      location_lng,
      function_id,
      cost,
    } = req.body;

    const { data, error } = await supabase
      .from('vendors')
      .insert({
        wedding_id,
        vendor_name,
        vendor_type,
        phone,
        email,
        address,
        city,
        state,
        district,
        village,
        location_lat: parseFloat(location_lat),
        location_lng: parseFloat(location_lng),
        function_id,
        cost: parseFloat(cost),
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await auditLogger(req, 'vendors', 'create', data.vendor_id, undefined, data);

    res.json({ success: true, vendor: data });
  } catch (error) {
    res.status(400).json({ error: 'Failed to add vendor' });
  }
});

/**
 * Update vendor rating and feedback
 */
router.put('/:wedding_id/vendors/:vendor_id/rating', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, vendor_id } = req.params;
    const { rating, feedback } = req.body;

    const { data: vendor } = await supabase
      .from('vendors')
      .select('feedback_json')
      .eq('vendor_id', vendor_id)
      .single();

    const existingFeedback = vendor?.feedback_json || [];
    const newFeedback = [
      ...existingFeedback,
      {
        user_id: req.user?.id,
        rating,
        feedback,
        created_at: new Date().toISOString(),
      },
    ];

    const { data, error } = await supabase
      .from('vendors')
      .update({
        rating: rating,
        feedback_json: newFeedback,
      })
      .eq('vendor_id', vendor_id)
      .select()
      .single();

    if (error) throw error;

    await auditLogger(req, 'vendors', 'update', vendor_id, vendor, data);

    res.json({ success: true, vendor: data });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update rating' });
  }
});

/**
 * Assign vendor to function
 */
router.post('/:wedding_id/vendors/:vendor_id/assign', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, vendor_id } = req.params;
    const { function_id } = req.body;

    const { data, error } = await supabase
      .from('vendors')
      .update({ function_id })
      .eq('vendor_id', vendor_id)
      .select()
      .single();

    if (error) throw error;

    await auditLogger(req, 'vendors', 'update', vendor_id, undefined, data);

    res.json({ success: true, vendor: data });
  } catch (error) {
    res.status(400).json({ error: 'Failed to assign vendor' });
  }
});

/**
 * Toggle vendor sharing
 */
router.put('/:wedding_id/vendors/:vendor_id/sharing', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id, vendor_id } = req.params;
    const { shared_toggle } = req.body;

    const { data, error } = await supabase
      .from('vendors')
      .update({ shared_toggle })
      .eq('vendor_id', vendor_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, shared: shared_toggle });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update sharing' });
  }
});

/**
 * Export vendors to PDF/Excel
 */
router.get('/:wedding_id/vendors/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wedding_id } = req.params;
    const { format } = req.query; // 'pdf' or 'excel'

    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('wedding_id', wedding_id);

    if (error) throw error;

    // Format export
    const exportData = vendors?.map((v) => ({
      'Vendor Name': v.vendor_name,
      'Type': v.vendor_type,
      'City': v.city,
      'State': v.state,
      'Phone': v.phone,
      'Email': v.email,
      'Rating': v.rating,
      'Cost': v.cost,
      'Payment Status': v.payment_status,
    })) || [];

    // Simple JSON export (expand to PDF/Excel in production)
    res.json({
      success: true,
      format,
      timestamp: new Date().toISOString(),
      data: exportData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export vendors' });
  }
});

/**
 * Get location suggestions (state→district→city→village)
 * In production, integrate with OpenStreetMap API
 */
router.get('/locations/hierarchy', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mock location hierarchy for Indian states
    const locationHierarchy = {
      maharashtra: {
        state: 'Maharashtra',
        districts: {
          mumbai: {
            cities: ['Mumbai', 'Thane', 'Navi Mumbai'],
          },
          pune: {
            cities: ['Pune', 'Pimpri Chinchwad', 'Baramati'],
          },
          nashik: {
            cities: ['Nashik', 'Sinnar'],
          },
        },
      },
      delhi: {
        state: 'Delhi',
        districts: {
          delhi: {
            cities: ['New Delhi', 'Dwarka', 'Noida'],
          },
        },
      },
      // Add more states as needed
    };

    res.json(locationHierarchy);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

export default router;
