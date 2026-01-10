/**
 * Backend Location Search Service
 * 
 * Features:
 * - Real-time venue search by location
 * - Vendor search with distance calculation
 * - Reverse geocoding for coordinates
 * - Caching for performance
 * - No key exposure - all external APIs called from backend
 */

import { createClient } from '@supabase/supabase-js';
import NodeGeocoder from 'node-geocoder';
import { logger } from '@/config/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize geocoder (using OSM/Nominatim - free, no key required)
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  timeout: 10000,
} as any);

interface LocationSearchParams {
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // km
  keyword?: string;
  limit?: number;
}

class LocationSearchService {
  /**
   * Search venues with advanced filtering
   */
  async searchVenues(params: LocationSearchParams) {
    try {
      let query = supabase
        .from('venues')
        .select(
          `
          id,
          name,
          description,
          address,
          state,
          city,
          pincode,
          capacity_min,
          capacity_max,
          venue_type,
          base_price,
          price_per_plate,
          rating,
          review_count,
          images_urls,
          phone,
          email,
          latitude,
          longitude
        `
        )
        .eq('visibility_scope', 'public');

      // Filter by state and city
      if (params.state) {
        query = query.eq('state', params.state);
      }
      if (params.city) {
        query = query.eq('city', params.city);
      }

      // Filter by keyword
      if (params.keyword) {
        query = query.or(
          `name.ilike.%${params.keyword}%,description.ilike.%${params.keyword}%,venue_type.ilike.%${params.keyword}%`
        );
      }

      // Sort by rating and limit
      query = query
        .order('rating', { ascending: false })
        .limit(params.limit || 20);

      const { data, error } = await query;

      if (error) throw error;

      // Calculate distance if coordinates provided
      if (params.latitude && params.longitude) {
        const venuesWithDistance = data.map((venue: any) => ({
          ...venue,
          distance: this.calculateDistance(
            params.latitude!,
            params.longitude!,
            venue.latitude,
            venue.longitude
          ),
        }));

        // Filter by radius if specified
        if (params.radius) {
          return venuesWithDistance.filter(
            (v: any) => v.distance <= params.radius!
          );
        }

        // Sort by distance
        return venuesWithDistance.sort((a: any, b: any) => a.distance - b.distance);
      }

      return data;
    } catch (error) {
      logger.error('Venue search error:', error);
      throw error;
    }
  }

  /**
   * Search vendors with location filtering
   */
  async searchVendors(params: LocationSearchParams) {
    try {
      let query = supabase
        .from('vendors')
        .select(
          `
          id,
          name,
          category,
          description,
          state,
          city,
          address,
          phone,
          email,
          website,
          price,
          currency,
          rating,
          review_count,
          latitude,
          longitude,
          service_range
        `
        )
        .eq('visibility', 'public');

      // Filter by state and city
      if (params.state) {
        query = query.eq('state', params.state);
      }
      if (params.city) {
        query = query.eq('city', params.city);
      }

      // Filter by keyword
      if (params.keyword) {
        query = query.or(
          `name.ilike.%${params.keyword}%,category.ilike.%${params.keyword}%,description.ilike.%${params.keyword}%`
        );
      }

      const { data, error } = await query
        .order('rating', { ascending: false })
        .limit(params.limit || 20);

      if (error) throw error;

      // Calculate distance if coordinates provided
      if (params.latitude && params.longitude) {
        const vendorsWithDistance = data.map((vendor: any) => ({
          ...vendor,
          distance: this.calculateDistance(
            params.latitude!,
            params.longitude!,
            vendor.latitude || 0,
            vendor.longitude || 0
          ),
        }));

        // Filter by radius if specified
        if (params.radius) {
          return vendorsWithDistance.filter(
            (v: any) => v.distance <= params.radius!
          );
        }

        // Sort by distance
        return vendorsWithDistance.sort((a: any, b: any) => a.distance - b.distance);
      }

      return data;
    } catch (error) {
      logger.error('Vendor search error:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * Uses Nominatim (OpenStreetMap) - no API key needed
   */
  async reverseGeocode(latitude: number, longitude: number) {
    try {
      // Check cache first
      const cached = await this.getCachedGeocode(latitude, longitude);
      if (cached) {
        return cached;
      }

      // Perform reverse geocoding
      const results = await geocoder.reverse({ lat: latitude, lon: longitude });

      if (!results || results.length === 0) {
        return null;
      }

      const result = results[0];
      const location = {
        id: `geo-${latitude}-${longitude}`,
        latitude,
        longitude,
        address: result.formattedAddress || '',
        state: (result as any).administrativeArea || (result as any).state || '',
        city: result.city || '',
        pincode: result.zipcode || '',
      };

      // Cache the result
      await this.cacheGeocode(location);

      return location;
    } catch (error) {
      logger.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Get cached geocode result
   */
  private async getCachedGeocode(latitude: number, longitude: number) {
    try {
      const { data, error } = await supabase
        .from('geolocation_cache')
        .select('*')
        .eq('latitude', latitude)
        .eq('longitude', longitude)
        .single();

      if (!error && data) {
        // Update hits
        await supabase
          .from('geolocation_cache')
          .update({ hits: data.hits + 1, last_verified: new Date().toISOString() })
          .eq('id', data.id);

        return {
          id: data.id,
          latitude,
          longitude,
          address: data.address,
          state: data.state,
          city: data.city,
          pincode: data.pincode,
        };
      }
    } catch (error) {
      logger.warn('Geocode cache lookup failed:', error);
    }

    return null;
  }

  /**
   * Cache geocode result
   */
  private async cacheGeocode(location: any) {
    try {
      await supabase.from('geolocation_cache').insert({
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        state: location.state,
        city: location.city,
        pincode: location.pincode,
      });
    } catch (error) {
      logger.warn('Geocode cache insertion failed:', error);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((R * c) * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get all states
   */
  async getStates() {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('state, state_code')
        .order('state');

      if (error) throw error;

      // Remove duplicates client-side
      const uniqueStates = Array.from(new Map(
        (data || []).map(item => [item.state, item])
      ).values());

      return uniqueStates;
    } catch (error) {
      logger.error('Get states error:', error);
      throw error;
    }
  }

  /**
   * Get cities for a state
   */
  async getCitiesByState(state: string) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('city')
        .eq('state', state)
        .order('city');

      if (error) throw error;

      // Remove duplicates client-side
      const uniqueCities = Array.from(new Set(
        (data || []).map(item => item.city)
      ));

      return uniqueCities;
    } catch (error) {
      logger.error('Get cities error:', error);
      throw error;
    }
  }

  /**
   * Track search for analytics
   */
  async trackSearch(
    userId: string,
    weddingId: string | null,
    searchType: string,
    query: string,
    filters: any,
    resultsCount: number
  ) {
    try {
      await supabase.from('search_history').insert({
        user_id: userId,
        wedding_id: weddingId,
        search_type: searchType,
        search_query: query,
        filters,
        results_count: resultsCount,
      });
    } catch (error) {
      logger.warn('Search tracking failed:', error);
    }
  }
}

export const locationSearchService = new LocationSearchService();
