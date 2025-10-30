"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "./ui/card";
import { Furniture } from "../lib/types";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export const FurnitureCard = ({ furniture }: { furniture: Furniture }) => {

  const [currentIndex, setCurrentIndex] = useState(0);
  const images = furniture.images.length ? furniture.images : [{ url: "/placeholder.jpg" }];

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const avgRating = furniture.averageRating || 0;
    
  return (
    <Link href={`/product/${furniture.id}`}>
      <Card className="hover:shadow-lg transition-all duration-200 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full h-64 overflow-hidden">
            <Image
              src={images[currentIndex].url}
              alt={furniture.name}
              width={400}
              height={300}
              className="object-cover w-full h-full transition-all duration-300"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === currentIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="p-4 flex flex-col justify-between">
            <h3 className="text-lg font-semibold mb-1">{furniture.name}</h3>
            <p className="text-blue-600 font-bold text-xl">₹{furniture.price}</p>
            {avgRating > 0 && (
              <div className="flex items-center space-x-1 text-yellow-500 mt-2">
                <Star className="w-4 h-4 fill-yellow-500" />
                <span className="text-sm">{avgRating.toFixed(1)} / 5</span>
                <span className="text-gray-500 text-sm">
                  ({furniture.reviewCount || 0})
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
