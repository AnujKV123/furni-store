"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFurnitureById, useMe } from "@/app/lib/queries";
import { api } from "@/app/lib/api";
import { ArrowLeft, ShoppingCart, CreditCard, Package, User } from "lucide-react";
import Link from "next/link";

interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function DirectPurchasePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: furnitureResp, isLoading: furnitureLoading } = useFurnitureById(id as string);
  const { data: userResp, isLoading: userLoading } = useMe();
  
  const furniture = furnitureResp?.data;
  const user = userResp?.data;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push(`/auth/login?redirect=/buy/${id}`);
    }
  }, [user, userLoading, router, id]);
  
  const [quantity, setQuantity] = useState(1);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      setShippingInfo(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Show loading while checking authentication or loading furniture
  if (userLoading || furnitureLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login required message if not authenticated
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-16">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Login Required</h2>
          <p className="text-gray-500 mb-6">Please log in to your account to make a purchase.</p>
          <Link 
            href={`/auth/login?redirect=/buy/${id}`}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (!furniture) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Product not found</h2>
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist.</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = Number(furniture.price) * quantity;
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + tax;

  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    // Basic validation
    if (quantity <= 0) return false;
    
    // Required fields for all users
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    
    for (const field of requiredFields) {
      if (!shippingInfo[field as keyof ShippingInfo]?.trim()) {
        return false;
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingInfo.email)) {
      return false;
    }
    
    return true;
  };

  const getFieldError = (field: keyof ShippingInfo) => {
    if (!shippingInfo[field]?.trim()) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    if (field === 'email' && shippingInfo.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(shippingInfo.email)) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  };

  const handleDirectPurchase = async () => {
    // Ensure user is still authenticated
    if (!user) {
      alert('Please log in to complete your purchase.');
      router.push(`/auth/login?redirect=/buy/${id}`);
      return;
    }

    if (!isFormValid()) {
      // Find the first missing field to show specific error
      const requiredFields = [
        { key: 'name', label: 'Full Name' },
        { key: 'email', label: 'Email Address' },
        { key: 'phone', label: 'Phone Number' },
        { key: 'address', label: 'Street Address' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'zipCode', label: 'ZIP Code' }
      ];
      
      for (const field of requiredFields) {
        if (!shippingInfo[field.key as keyof ShippingInfo]?.trim()) {
          alert(`Please fill in the ${field.label} field before proceeding.`);
          return;
        }
      }
      
      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(shippingInfo.email)) {
        alert('Please enter a valid email address.');
        return;
      }
      
      alert('Please fill in all required information correctly.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create order directly with the single item (authenticated users only)
      const orderData = {
        items: [{
          furnitureId: furniture.id,
          quantity: quantity
        }]
      };

      // Only use authenticated checkout
      const response = await api.post('/checkout/place', orderData);
      
      if (response.data.success) {
        const orderId = response.data.data.id || response.data.data.order?.id;
        router.push(`/order/success?orderId=${orderId}&total=${total}`);
      } else {
        throw new Error('Order creation failed');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          "Purchase failed. Please try again.";
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href={`/product/${furniture.id}`} 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Product Details
            </h2>
            
            <div className="flex gap-4">
              <img 
                src={furniture.images?.[0]?.url || '/placeholder-furniture.jpg'} 
                alt={furniture.name}
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDE3SDE2TTE2IDlIMTJNMTIgOUg4VjEzSDEyVjE3SDhWMTNNOCAxM1Y5IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                }}
              />
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{furniture.name}</h3>
                <p className="text-gray-600 text-sm mt-1">SKU: {furniture.sku}</p>
                <p className="text-gray-600 text-sm">Category: {furniture.category?.name}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-lg font-bold text-blue-600">
                    ₹{Number(furniture.price).toLocaleString()}
                  </span>
                  <span className="text-gray-500">each</span>
                </div>
              </div>
            </div>
            
            {/* Quantity Selector */}
            <div className="mt-4 pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border rounded-lg hover:bg-gray-50"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 border rounded-lg min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border rounded-lg hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Shipping Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={shippingInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('name') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {getFieldError('name') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('name')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={shippingInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('email') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {getFieldError('email') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('email')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={shippingInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('phone') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                />
                {getFieldError('phone') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('phone')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={shippingInfo.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('zipCode') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter ZIP code"
                />
                {getFieldError('zipCode') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('zipCode')}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={shippingInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('address') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your street address"
                />
                {getFieldError('address') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('address')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={shippingInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('city') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your city"
                />
                {getFieldError('city') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('city')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={shippingInfo.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('state') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your state"
                />
                {getFieldError('state') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError('state')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              Order Summary
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'})</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (GST 18%)</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Amount</span>
                  <span className="text-blue-600">₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleDirectPurchase}
                disabled={!isFormValid() || isProcessing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Complete Purchase - ₹{total.toLocaleString()}
                  </>
                )}
              </button>
              
              <Link 
                href={`/product/${furniture.id}`} 
                className="w-full block text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Product
              </Link>
            </div>
          </div>



          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 text-sm">
              <CreditCard className="w-4 h-4" />
              <span className="font-medium">Secure Purchase</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Your order information is secure and encrypted. Free delivery available on all orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}