"use client";

import { useState, useEffect } from "react";
import { FurnitureCard } from "./FurnitureCard";
import { FurnitureCardSkeleton } from "./FurnitureCardSkeleton";
import { useRecommendations } from "../lib/queries";
import { Furniture } from "../lib/types";
import { recommendationService } from "../lib/recommendationService";
import { RefreshCw, TrendingUp, User, Star, Info } from "lucide-react";

interface RecommendedSectionProps {
  userId?: number;
  currentProductId?: number;
  categoryId?: number;
  limit?: number;
  title?: string;
  showAlgorithmInfo?: boolean;
  enableTracking?: boolean;
}

export const RecommendedSection = ({ 
  userId, 
  currentProductId,
  categoryId,
  limit = 6,
  title,
  showAlgorithmInfo = false,
  enableTracking = true
}: RecommendedSectionProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { 
    data: recommendationData, 
    isLoading, 
    error, 
    refetch 
  } = useRecommendations(userId, {
    limit,
    excludeId: currentProductId,
    categoryId,
    refreshKey
  });

  const recommendations = recommendationData?.recommendations || [];
  const algorithm = recommendationData?.algorithm || '';
  const metadata = recommendationData?.metadata;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'hybrid':
      case 'collaborative':
        return <User className="w-4 h-4" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4" />;
      case 'content-based':
      case 'category-based':
        return <Star className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getAlgorithmDescription = (algorithm: string) => {
    switch (algorithm) {
      case 'hybrid':
        return 'Based on your purchase history and similar customers';
      case 'collaborative':
        return 'Customers who bought similar items also liked these';
      case 'popular':
        return 'Popular items among all customers';
      case 'content-based':
        return 'Similar to items you\'ve viewed';
      case 'category-based':
        return 'Based on your preferred categories';
      default:
        return 'Curated recommendations for you';
    }
  };

  const getDefaultTitle = (algorithm: string, hasUserId: boolean, metadata?: any) => {
    if (metadata?.fallbackUsed && !hasUserId) {
      return 'Popular Furniture';
    }
    
    if (metadata?.fallbackUsed && hasUserId) {
      return 'Popular Right Now';
    }
    
    switch (algorithm) {
      case 'hybrid':
      case 'hybrid-enhanced':
        return 'Recommended for You';
      case 'collaborative':
        return 'Customers Also Liked';
      case 'popular':
        return hasUserId ? 'Popular Right Now' : 'Popular Furniture';
      case 'content-based':
        return 'Similar Items';
      case 'category-based':
        return 'More in Your Favorite Categories';
      default:
        return hasUserId ? 'You Might Like' : 'Featured Items';
    }
  };

  const handleRecommendationClick = (furniture: Furniture, position: number) => {
    if (enableTracking && algorithm) {
      recommendationService.trackRecommendationClick(
        furniture.id,
        algorithm,
        position,
        userId
      );
    }
  };

  if (error) {
    return (
      <div className="mt-12 bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Load Recommendations
            </h3>
            <p className="text-red-600 text-sm">
              We're having trouble loading personalized recommendations. Please try again.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <FurnitureCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const displayTitle = title || getDefaultTitle(algorithm, !!userId, metadata);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">{displayTitle}</h2>
          {showAlgorithmInfo && algorithm && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
              {getAlgorithmIcon(algorithm)}
              <span className="hidden sm:inline">
                {getAlgorithmDescription(algorithm)}
              </span>
              {metadata?.fallbackUsed && (
                <Info className="w-3 h-3 ml-1" />
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {metadata && (
            <span className="text-xs text-gray-500 hidden md:inline">
              {metadata.totalRecommendations} items
              {metadata.userHasPurchaseHistory && !metadata.fallbackUsed && " • Personalized"}
            </span>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh recommendations"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Show fallback notice for users without purchase history */}
      {metadata?.fallbackUsed && userId && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <Info className="w-4 h-4" />
            <span>
              We're showing popular items since you haven't made any purchases yet. 
              Your recommendations will improve as you shop with us!
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recommendations.map((item: Furniture, index: number) => (
          <div key={item.id} onClick={() => handleRecommendationClick(item, index)}>
            <FurnitureCard furniture={item} />
          </div>
        ))}
      </div>

      {recommendations.length >= limit && (
        <div className="text-center mt-6">
          <button
            onClick={handleRefresh}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Show More Recommendations
          </button>
        </div>
      )}
    </div>
  );
};
