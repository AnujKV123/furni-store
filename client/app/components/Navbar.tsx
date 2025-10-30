"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Menu, LogOut, ShoppingCart, User } from "lucide-react";
import { useMe, useCart } from "@/app/lib/queries";

export const Navbar = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Listen for token changes
  useEffect(() => {
    const handleTokenChange = () => {
      setForceRefresh(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    };

    window.addEventListener("tokenChanged", handleTokenChange);
    return () => window.removeEventListener("tokenChanged", handleTokenChange);
  }, [queryClient]);

  // Fetch user profile
  const { data: userResp, isLoading } = useMe();
  const user = userResp?.data;

  // Fetch cart data to show item count
  const { data: cartResp } = useCart();
  const cart = cartResp?.data || cartResp;
  const cartItemCount =
    cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ||
    0;

  const logout = () => {
    // Remove tokens
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    
    // Clear all queries and reset cache
    queryClient.clear();
    queryClient.invalidateQueries();
    
    // Close menu
    setMenuOpen(false);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("tokenChanged"));
    
    // Force a page reload to ensure clean state
    window.location.href = "/";
  };

  return (
    <nav className="bg-white border-b px-4 sm:px-6 py-4 shadow-sm">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600">
          FurniStore
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : user ? (
            <>
              <Link
                href="/cart"
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors relative"
              >
                <ShoppingCart size={20} />
                <span className="hidden sm:inline">Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <User size={18} />
                  <span className="font-medium">{user.name || "Profile"}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-md z-10">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu size={24} />
          </button>

          {menuOpen && (
            <div className="absolute right-4 top-16 w-48 bg-white border rounded-lg shadow-md z-20">
              {isLoading ? (
                <p className="px-4 py-2 text-gray-500 text-sm">Loading...</p>
              ) : user ? (
                <>
                  <Link
                    href="/cart"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors relative"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ShoppingCart size={16} />
                    Cart
                    {cartItemCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center ml-auto">
                        {cartItemCount > 9 ? "9+" : cartItemCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={16} /> My Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
