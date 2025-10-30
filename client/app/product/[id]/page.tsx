"use client";

import { useFurnitureById, useMe } from "@/app/lib/queries";
import { ReviewSection } from "@/app/components/ReviewSection";
import { SimilarRecommendations } from "@/app/components/SimilarRecommendations";
import AddToCartButton from "@/app/components/AddToCartButton";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { useState } from "react";
import { Star, Package, Ruler, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function ProductDetail() {
  const { id } = useParams();
  const { data: response, isLoading, error } = useFurnitureById(id as string);
  const { data: userProfile } = useMe();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-20 bg-gray-200 rounded-lg"
                  ></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Product
          </h1>
          <p className="text-gray-600">
            Something went wrong while loading the product details.
          </p>
        </div>
      </div>
    );
  }

  if (!response?.success || !response?.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Product Not Found
          </h1>
          <p className="text-gray-600">
            The product you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const furniture = response.data;
  const images = furniture.images || [];
  const currentImage = images[selectedImageIndex];

  const dimensions = {
    width: furniture.widthCm,
    height: furniture.heightCm,
    depth: furniture.depthCm,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery Section */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
            {currentImage ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Image
                    src={currentImage.url}
                    alt={furniture.name}
                    fill
                    className="object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                  <div className="relative">
                    <Image
                      src={currentImage.url}
                      alt={furniture.name}
                      width={800}
                      height={800}
                      className="w-full h-auto max-h-[80vh] object-contain"
                    />
                    {/* Dimension Overlays */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Width indicator */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        W: {dimensions.width}cm
                      </div>
                      {/* Height indicator */}
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 -rotate-90 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        H: {dimensions.height}cm
                      </div>
                      {/* Depth indicator */}
                      <div className="absolute right-4 top-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        D: {dimensions.depth}cm
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Package size={64} />
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img: any, index: number) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${furniture.name} view ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information Section */}
        <div className="space-y-6">
          {/* Title and Category */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>{furniture.category?.name}</span>
              <span>•</span>
              <span>SKU: {furniture.sku}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {furniture.name}
            </h1>

            {/* Rating */}
            {furniture.averageRating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={`${
                        star <= Math.round(furniture.averageRating!)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {furniture.averageRating.toFixed(1)} ({furniture.reviewCount}{" "}
                  reviews)
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="border-t border-b py-4">
            <div className="text-3xl font-bold text-gray-900">
              ₹{furniture.price.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Price inclusive of all taxes
            </p>
          </div>

          {/* Description */}
          {furniture.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {furniture.description}
              </p>
            </div>
          )}

          {/* Dimensions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Ruler size={20} />
              Dimensions
            </h3>
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {dimensions.width}
                </div>
                <div className="text-sm text-gray-500">Width (cm)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {dimensions.height}
                </div>
                <div className="text-sm text-gray-500">Height (cm)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {dimensions.depth}
                </div>
                <div className="text-sm text-gray-500">Depth (cm)</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <AddToCartButton furnitureId={furniture.id} />
              </div>
              {userProfile?.data ? (
                <Link
                  href={`/buy/${furniture.id}`}
                  className="flex-1 content-center align-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  Buy Now
                </Link>
              ) : (
                <Link
                  href={`/auth/login?redirect=/buy/${furniture.id}`}
                  className="flex-1 content-center align-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  Login to Buy
                </Link>
              )}
            </div>

            <div className="text-sm text-gray-500 text-center">
              <ShoppingCart size={16} className="inline mr-1" />
              {userProfile?.data ? 'Free delivery available' : 'Login required for purchase • Free delivery available'}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Recommendations */}
      <SimilarRecommendations
        furnitureId={furniture.id}
        userId={userProfile?.data?.id}
        limit={4}
        enableTracking={true}
      />

      {/* Review Section */}
      <div className="mt-12">
        <ReviewSection
          productId={furniture.id.toString()}
          reviews={furniture.reviews || []}
        />
      </div>
    </div>
  );
}
