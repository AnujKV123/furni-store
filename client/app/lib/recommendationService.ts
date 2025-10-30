"use client";

import { api } from "./api";

export interface RecommendationOptions {
  limit?: number;
  excludeId?: number;
  categoryId?: number;
}

export interface RecommendationResponse {
  recommendations: any[];
  algorithm: string;
  metadata?: {
    userHasPurchaseHistory: boolean;
    fallbackUsed: boolean;
    totalRecommendations: number;
  };
}

export class RecommendationService {
  private static instance: RecommendationService;
  private trackingEnabled = true;

  static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  /**
   * Get personalized recommendations for a user
   * Falls back to popular items if user has no purchase history
   */
  async getUserRecommendations(
    userId: number,
    options: RecommendationOptions = {}
  ): Promise<RecommendationResponse> {
    const { limit = 10, excludeId } = options;
    
    try {
      // First try to get personalized recommendations
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (excludeId) params.append('excludeId', excludeId.toString());
      
      const response = await api.get(`/recommendations/user/${userId}?${params.toString()}`);
      const data = response.data;
      
      // Track recommendation request
      this.trackRecommendationRequest(userId, 'personalized', data.algorithm);
      
      return {
        recommendations: data.recommendations || [],
        algorithm: data.algorithm || 'hybrid',
        metadata: {
          userHasPurchaseHistory: data.algorithm !== 'popular',
          fallbackUsed: data.algorithm === 'popular',
          totalRecommendations: data.recommendations?.length || 0
        }
      };
    } catch (error) {
      console.warn('Failed to get personalized recommendations, falling back to popular items:', error);
      
      // Fallback to popular items
      return this.getPopularRecommendations(options);
    }
  }

  /**
   * Get popular recommendations (fallback for users without history)
   */
  async getPopularRecommendations(
    options: RecommendationOptions = {}
  ): Promise<RecommendationResponse> {
    const { limit = 10, excludeId } = options;
    
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (excludeId) params.append('excludeId', excludeId.toString());
      
      const response = await api.get(`/recommendations/popular?${params.toString()}`);
      const data = response.data;
      
      // Track fallback usage
      this.trackRecommendationRequest(undefined, 'popular', 'popular');
      
      return {
        recommendations: data.recommendations || [],
        algorithm: 'popular',
        metadata: {
          userHasPurchaseHistory: false,
          fallbackUsed: true,
          totalRecommendations: data.recommendations?.length || 0
        }
      };
    } catch (error) {
      console.error('Failed to get popular recommendations:', error);
      throw error;
    }
  }

  /**
   * Get similar product recommendations
   */
  async getSimilarRecommendations(
    furnitureId: number,
    options: RecommendationOptions = {}
  ): Promise<RecommendationResponse> {
    const { limit = 6 } = options;
    
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      
      const response = await api.get(`/recommendations/similar/${furnitureId}?${params.toString()}`);
      const data = response.data;
      
      // Track similar product request
      this.trackRecommendationRequest(undefined, 'similar', data.algorithm, furnitureId);
      
      return {
        recommendations: data.recommendations || [],
        algorithm: data.algorithm || 'content-based',
        metadata: {
          userHasPurchaseHistory: false,
          fallbackUsed: false,
          totalRecommendations: data.recommendations?.length || 0
        }
      };
    } catch (error) {
      console.error('Failed to get similar recommendations:', error);
      throw error;
    }
  }

  /**
   * Get category-based recommendations
   */
  async getCategoryRecommendations(
    categoryId: number,
    options: RecommendationOptions = {}
  ): Promise<RecommendationResponse> {
    const { limit = 6, excludeId } = options;
    
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (excludeId) params.append('excludeId', excludeId.toString());
      
      const response = await api.get(`/recommendations/category/${categoryId}?${params.toString()}`);
      const data = response.data;
      
      // Track category-based request
      this.trackRecommendationRequest(undefined, 'category', data.algorithm, undefined, categoryId);
      
      return {
        recommendations: data.recommendations || [],
        algorithm: data.algorithm || 'category-based',
        metadata: {
          userHasPurchaseHistory: false,
          fallbackUsed: false,
          totalRecommendations: data.recommendations?.length || 0
        }
      };
    } catch (error) {
      console.error('Failed to get category recommendations:', error);
      throw error;
    }
  }

  /**
   * Get intelligent recommendations based on context
   * This method determines the best recommendation strategy based on available data
   */
  async getIntelligentRecommendations(
    context: {
      userId?: number;
      currentProductId?: number;
      categoryId?: number;
      limit?: number;
    }
  ): Promise<RecommendationResponse> {
    const { userId, currentProductId, categoryId, limit = 10 } = context;
    
    // Strategy 1: If user is logged in, try personalized recommendations
    if (userId) {
      try {
        const personalizedResult = await this.getUserRecommendations(userId, {
          limit,
          excludeId: currentProductId
        });
        
        // If we got good personalized recommendations, return them
        if (personalizedResult.recommendations.length >= Math.min(4, limit)) {
          return personalizedResult;
        }
        
        // If personalized recommendations are sparse, supplement with category-based
        if (categoryId && personalizedResult.recommendations.length < limit) {
          const categoryResult = await this.getCategoryRecommendations(categoryId, {
            limit: limit - personalizedResult.recommendations.length,
            excludeId: currentProductId
          });
          
          return {
            recommendations: [
              ...personalizedResult.recommendations,
              ...categoryResult.recommendations.filter(item => 
                !personalizedResult.recommendations.some(existing => existing.id === item.id)
              )
            ],
            algorithm: 'hybrid-enhanced',
            metadata: {
              userHasPurchaseHistory: personalizedResult.metadata?.userHasPurchaseHistory || false,
              fallbackUsed: true,
              totalRecommendations: personalizedResult.recommendations.length + categoryResult.recommendations.length
            }
          };
        }
        
        return personalizedResult;
      } catch (error) {
        console.warn('Personalized recommendations failed, trying alternatives:', error);
      }
    }
    
    // Strategy 2: If viewing a specific product, show similar items
    if (currentProductId) {
      try {
        return await this.getSimilarRecommendations(currentProductId, { limit });
      } catch (error) {
        console.warn('Similar recommendations failed:', error);
      }
    }
    
    // Strategy 3: If in a specific category, show category recommendations
    if (categoryId) {
      try {
        return await this.getCategoryRecommendations(categoryId, { 
          limit,
          excludeId: currentProductId 
        });
      } catch (error) {
        console.warn('Category recommendations failed:', error);
      }
    }
    
    // Strategy 4: Fallback to popular items
    return this.getPopularRecommendations({ limit, excludeId: currentProductId });
  }

  /**
   * Track recommendation interactions for analytics
   */
  private trackRecommendationRequest(
    userId: number | undefined,
    requestType: string,
    algorithm: string,
    productId?: number,
    categoryId?: number
  ): void {
    if (!this.trackingEnabled) return;
    
    try {
      // Store tracking data in localStorage for now
      // In production, this would be sent to an analytics service
      const trackingData = {
        timestamp: new Date().toISOString(),
        userId,
        requestType,
        algorithm,
        productId,
        categoryId,
        sessionId: this.getSessionId()
      };
      
      const existingData = JSON.parse(localStorage.getItem('recommendation_analytics') || '[]');
      existingData.push(trackingData);
      
      // Keep only last 100 entries to prevent localStorage bloat
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }
      
      localStorage.setItem('recommendation_analytics', JSON.stringify(existingData));
    } catch (error) {
      console.warn('Failed to track recommendation request:', error);
    }
  }

  /**
   * Track when user clicks on a recommended item
   */
  trackRecommendationClick(
    recommendationId: number,
    algorithm: string,
    position: number,
    userId?: number
  ): void {
    if (!this.trackingEnabled) return;
    
    try {
      const clickData = {
        timestamp: new Date().toISOString(),
        type: 'recommendation_click',
        recommendationId,
        algorithm,
        position,
        userId,
        sessionId: this.getSessionId()
      };
      
      const existingData = JSON.parse(localStorage.getItem('recommendation_clicks') || '[]');
      existingData.push(clickData);
      
      // Keep only last 50 click entries
      if (existingData.length > 50) {
        existingData.splice(0, existingData.length - 50);
      }
      
      localStorage.setItem('recommendation_clicks', JSON.stringify(existingData));
    } catch (error) {
      console.warn('Failed to track recommendation click:', error);
    }
  }

  /**
   * Get analytics data for debugging/monitoring
   */
  getAnalyticsData(): {
    requests: any[];
    clicks: any[];
  } {
    try {
      return {
        requests: JSON.parse(localStorage.getItem('recommendation_analytics') || '[]'),
        clicks: JSON.parse(localStorage.getItem('recommendation_clicks') || '[]')
      };
    } catch (error) {
      console.warn('Failed to get analytics data:', error);
      return { requests: [], clicks: [] };
    }
  }

  /**
   * Clear analytics data
   */
  clearAnalyticsData(): void {
    try {
      localStorage.removeItem('recommendation_analytics');
      localStorage.removeItem('recommendation_clicks');
    } catch (error) {
      console.warn('Failed to clear analytics data:', error);
    }
  }

  /**
   * Get or create session ID for tracking
   */
  private getSessionId(): string {
    try {
      let sessionId = sessionStorage.getItem('recommendation_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('recommendation_session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      return `session_${Date.now()}_fallback`;
    }
  }

  /**
   * Enable/disable tracking
   */
  setTrackingEnabled(enabled: boolean): void {
    this.trackingEnabled = enabled;
  }
}

// Export singleton instance
export const recommendationService = RecommendationService.getInstance();