"use client";

import { useState, useEffect, useContext, createContext, ReactNode } from "react";
import { useMe } from "./queries";
import { recommendationService } from "./recommendationService";

interface RecommendationContextType {
  userId?: number;
  hasPurchaseHistory: boolean;
  preferredCategories: number[];
  recommendationPreferences: {
    enablePersonalized: boolean;
    enableTracking: boolean;
    preferredAlgorithm?: string;
  };
  updatePreferences: (preferences: Partial<RecommendationContextType['recommendationPreferences']>) => void;
  refreshUserData: () => void;
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

interface RecommendationProviderProps {
  children: ReactNode;
}

export const RecommendationProvider = ({ children }: RecommendationProviderProps) => {
  const { data: userProfile } = useMe();
  const [hasPurchaseHistory, setHasPurchaseHistory] = useState(false);
  const [preferredCategories, setPreferredCategories] = useState<number[]>([]);
  const [recommendationPreferences, setRecommendationPreferences] = useState({
    enablePersonalized: true,
    enableTracking: true,
    preferredAlgorithm: undefined as string | undefined
  });

  const userId = userProfile?.data?.id;

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('recommendation_preferences');
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setRecommendationPreferences(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Failed to load recommendation preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('recommendation_preferences', JSON.stringify(recommendationPreferences));
      
      // Update recommendation service tracking setting
      recommendationService.setTrackingEnabled(recommendationPreferences.enableTracking);
    } catch (error) {
      console.warn('Failed to save recommendation preferences:', error);
    }
  }, [recommendationPreferences]);

  // Check user's purchase history when user data changes
  useEffect(() => {
    if (userId) {
      checkUserPurchaseHistory(userId);
    } else {
      setHasPurchaseHistory(false);
      setPreferredCategories([]);
    }
  }, [userId]);

  const checkUserPurchaseHistory = async (userId: number) => {
    try {
      // This would typically be an API call to check user's order history
      // For now, we'll use the analytics data as a proxy
      const analyticsData = recommendationService.getAnalyticsData();
      const userRequests = analyticsData.requests.filter(req => req.userId === userId);
      
      // If user has made recommendation requests with personalized algorithms,
      // they likely have purchase history
      const hasPersonalizedRequests = userRequests.some(req => 
        req.algorithm && !['popular', 'category-based'].includes(req.algorithm)
      );
      
      setHasPurchaseHistory(hasPersonalizedRequests);
      
      // Extract preferred categories from analytics (simplified approach)
      const categoryRequests = userRequests.filter(req => req.categoryId);
      const categories = [...new Set(categoryRequests.map(req => req.categoryId))];
      setPreferredCategories(categories);
      
    } catch (error) {
      console.warn('Failed to check user purchase history:', error);
      setHasPurchaseHistory(false);
    }
  };

  const updatePreferences = (newPreferences: Partial<RecommendationContextType['recommendationPreferences']>) => {
    setRecommendationPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  const refreshUserData = () => {
    if (userId) {
      checkUserPurchaseHistory(userId);
    }
  };

  const contextValue: RecommendationContextType = {
    userId,
    hasPurchaseHistory,
    preferredCategories,
    recommendationPreferences,
    updatePreferences,
    refreshUserData
  };

  return (
    <RecommendationContext.Provider value={contextValue}>
      {children}
    </RecommendationContext.Provider>
  );
};

export const useRecommendationContext = () => {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error('useRecommendationContext must be used within a RecommendationProvider');
  }
  return context;
};

// Hook for getting recommendation context without requiring provider
export const useRecommendationContextOptional = () => {
  const context = useContext(RecommendationContext);
  return context; // Can be undefined
};