"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Package, Mail, Home, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const total = searchParams.get("total");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
  }, []);

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7); // 7 days from now

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle className="text-green-500 w-20 h-20" />
              <div className="absolute -top-1 -right-1 bg-green-100 rounded-full p-2">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 text-lg">
            Thank you for your purchase. Your order has been confirmed and is being processed.
          </p>
        </div>

        {/* Order Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <Receipt className="w-6 h-6 text-blue-600" />
              Order Details
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono font-semibold text-blue-600">#{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-medium">{currentTime}</span>
              </div>
              {total && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-green-600">₹{Number(total).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className="font-medium text-green-600">✓ Paid</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Status:</span>
                <span className="font-medium text-blue-600">Processing</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <Package className="w-6 h-6 text-blue-600" />
              Delivery Information
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Delivery:</span>
                <span className="font-medium text-green-600">
                  {estimatedDelivery.toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Method:</span>
                <span className="font-medium">Standard Delivery</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Cost:</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tracking:</span>
                <span className="font-medium text-blue-600">Available in 24 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">What happens next?</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium text-blue-900">Order Confirmation</p>
                <p className="text-blue-700 text-sm">You'll receive an email confirmation shortly with your order details.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium text-blue-900">Processing</p>
                <p className="text-blue-700 text-sm">We'll prepare your furniture items for shipping within 1-2 business days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium text-blue-900">Shipping</p>
                <p className="text-blue-700 text-sm">Your order will be shipped and you'll receive tracking information.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <p className="font-medium text-blue-900">Delivery</p>
                <p className="text-blue-700 text-sm">Your furniture will be delivered to your specified address.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Continue Shopping
          </Link>
          
          <button
            onClick={() => {
              // In a real app, this would open an email client or show order details
              alert(`Order confirmation will be sent to your email. Order ID: ${orderId}`);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Email Order Details
          </button>
        </div>

        {/* Support Information */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-gray-600 text-sm mb-2">
            Need help with your order? Contact our customer support team.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <span className="text-blue-600">📞 1800-123-4567</span>
            <span className="text-blue-600">✉️ support@furniture.com</span>
            <span className="text-blue-600">💬 Live Chat Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
