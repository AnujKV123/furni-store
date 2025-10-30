"use client";

import { Card, CardContent } from "./ui/card";

export const FurnitureCardSkeleton = () => {
  return (
    <Card className="rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <div className="relative w-full h-64 bg-gray-200 animate-pulse"></div>
        <div className="p-4 space-y-3">
          <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="flex items-center space-x-1">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};