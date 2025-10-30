"use client";

import { useSimilarRecommendations } from "../lib/queries";
import { FurnitureCard } from "./FurnitureCard";
import { FurnitureCardSkeleton } from "./FurnitureCardSkeleton";
import { recommendationService } from "../lib/recommendationService";
import { Furniture } from "../lib/types";
import { RefreshCw, ArrowRight } from "lucide-react";
import { useState } from "react";

interface SimilarRecommendationsProps {
  furnitureId: number;
  limit?: number;
  userId?: number;
  enableTracking?: boolean;
}

export const SimilarRecommendations = ({
  furnitureId,
  limit = 4,
  userId,
  enableTracking = true
}: SimilarRecommendationsProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { 
    data: recommendationData, 
    isLoading, 
    error, 
    refetch 
  } = useSimilarRecommendations(furnitureId, { limit });

  const recommendations = recommendationData?.recommendations || [];
  const algorithm = recommendationData?.algorithm;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
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
              Unable to Load Similar Items
            </h3>
            <p className="text-red-600 text-sm">
              We're having trouble loading similar products. Please try again.
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
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Similar Items</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden md:inline">
            {recommendations.length} similar items
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh similar items"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            className="inline-flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Show More Similar Items
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};