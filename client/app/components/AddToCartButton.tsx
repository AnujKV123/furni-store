"use client";

import { useAddToCart } from "@/app/lib/queries";
import { useState } from "react";
import { ShoppingCart, Plus, Minus, Check } from "lucide-react";

export default function AddToCartButton({ furnitureId }: { furnitureId: number }) {
  const [qty, setQty] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const addToCart = useAddToCart();

  const handleQuantityChange = (change: number) => {
    const newQty = qty + change;
    if (newQty >= 1) {
      setQty(newQty);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart.mutateAsync({ furnitureId, quantity: qty });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error?.message || 
                          err?.response?.data?.error || 
                          err?.message || 
                          "Failed to add to cart";
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-3">
      {/* Quantity Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={qty <= 1}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
            {qty}
          </span>
          <button
            onClick={() => handleQuantityChange(1)}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={addToCart.isPending}
        className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          showSuccess
            ? "bg-green-600 text-white"
            : "bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        }`}
      >
        {addToCart.isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Adding...
          </>
        ) : showSuccess ? (
          <>
            <Check size={20} />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCart size={20} />
            Add to Cart
          </>
        )}
      </button>
    </div>
  );
}
