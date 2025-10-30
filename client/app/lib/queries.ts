import { api } from "./api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Furniture, Review, Category, FilterOptions, RecommendationResponse } from "./types";
import { getErrorMessage, formatErrorForUser } from "./errorUtils";

// ---- Fetch Furniture ----
export const useFurnitureList = (filters?: FilterOptions) =>
  useQuery({
    queryKey: ["furniture", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const url = `/furnitures${params.toString() ? `?${params.toString()}` : ''}`;
      return (await api.get(url)).data;
    },
  });

// ---- Single Furniture ----
export const useFurnitureById = (id: string) =>
  useQuery({
    queryKey: ["furniture", id],
    queryFn: async () => (await api.get(`/furnitures/${id}`)).data,
    enabled: !!id,
  });

// ---- Recommended Furniture ----
export const useRecommendedFurniture = (userId: string) =>
  useQuery({
    queryKey: ["recommended", userId],
    queryFn: async () => (await api.get(`/furnitures/recommendations/${userId}`)).data,
    enabled: !!userId,
  });

// ---- Enhanced Recommendations ----
export const useRecommendations = (
  userId?: number, 
  options?: { 
    limit?: number; 
    excludeId?: number; 
    refreshKey?: number;
    categoryId?: number;
  }
) => {
  const { limit = 10, excludeId, refreshKey = 0, categoryId } = options || {};
  
  return useQuery({
    queryKey: ["recommendations", userId, limit, excludeId, refreshKey, categoryId],
    queryFn: async () => {
      const { recommendationService } = await import('./recommendationService');
      
      return await recommendationService.getIntelligentRecommendations({
        userId,
        currentProductId: excludeId,
        categoryId,
        limit
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// ---- Similar Product Recommendations ----
export const useSimilarRecommendations = (
  furnitureId: number,
  options?: { limit?: number }
) => {
  const { limit = 6 } = options || {};
  
  return useQuery({
    queryKey: ["recommendations", "similar", furnitureId, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      
      const url = `/recommendations/similar/${furnitureId}${params.toString() ? `?${params.toString()}` : ''}`;
      return (await api.get(url)).data;
    },
    enabled: !!furnitureId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// ---- Category-based Recommendations ----
export const useCategoryRecommendations = (
  categoryId: number,
  options?: { limit?: number; excludeId?: number }
) => {
  const { limit = 6, excludeId } = options || {};
  
  return useQuery({
    queryKey: ["recommendations", "category", categoryId, limit, excludeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (excludeId) params.append('excludeId', excludeId.toString());
      
      const url = `/recommendations/category/${categoryId}${params.toString() ? `?${params.toString()}` : ''}`;
      return (await api.get(url)).data;
    },
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// ---- Create Order ----
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/orders", data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

// ---- Add Review ----
export const useAddReview = (productId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { rating: number; comment?: string; furnitureId: number; userId: number }) =>
      (await api.post(`/reviews`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["furniture", productId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "furniture", productId] });
    },
  });
};

// ---- Get Reviews for Furniture ----
export const useReviewsForFurniture = (furnitureId: string, page = 1, limit = 5) =>
  useQuery({
    queryKey: ["reviews", "furniture", furnitureId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      return (await api.get(`/reviews/furniture/${furnitureId}?${params.toString()}`)).data;
    },
    enabled: !!furnitureId,
  });

// ---- Check Review Eligibility ----
export const useCanUserReview = (userId: number | undefined, furnitureId: string) =>
  useQuery({
    queryKey: ["reviews", "can-review", userId, furnitureId],
    queryFn: async () => (await api.get(`/reviews/can-review/${userId}/${furnitureId}`)).data,
    enabled: !!userId && !!furnitureId,
  });

// --- Auth ---
export const useRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string }) => {
      const res = await api.post("/auth/register", data);
      return res.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      // Dispatch custom event to notify components about token change
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event('tokenChanged'));
      }
    },
    onError: (error) => {
      console.error('Registration failed:', getErrorMessage(error));
    }
  });
};

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      // Dispatch custom event to notify components about token change
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event('tokenChanged'));
      }
    },
    onError: (error) => {
      console.error('Login failed:', getErrorMessage(error));
    }
  });
};

export const useMe = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("No token available");
      }
      return (await api.get("/auth/me")).data;
    },
    enabled: !!(typeof window !== "undefined" && localStorage.getItem("token")),
    retry: false, // Don't retry on auth failures
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

// --- Cart ---
export const useCart = () =>
  useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("No token available");
      }
      return (await api.get("/cart")).data;
    },
    enabled: !!(typeof window !== "undefined" && localStorage.getItem("token")),
    retry: false, // Don't retry on auth failures
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

export const useAddToCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { furnitureId: number; quantity?: number }) =>
      (await api.post("/cart/add", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] })
  });
};

export const useUpdateCartItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { cartItemId: number; quantity: number }) =>
      (await api.post("/cart/update", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] })
  });
};

export const useRemoveCartItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cartItemId: number) => (await api.delete(`/cart/remove/${cartItemId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] })
  });
};

export const useClearCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post("/cart/clear")).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] })
  });
};

// --- Checkout ---
export const usePlaceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post("/checkout/place")).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    }
  });
};

// --- Orders ---
export const useOrder = (orderId: string) =>
  useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => (await api.get(`/orders/${orderId}`)).data,
    enabled: !!orderId,
  });

export const useUserOrders = (userId: string, page = 1, limit = 10) =>
  useQuery({
    queryKey: ["orders", "user", userId, page, limit],
    queryFn: async () => (await api.get(`/orders/user/${userId}?page=${page}&limit=${limit}`)).data,
    enabled: !!userId,
  });

export const useMyOrders = (page = 1, limit = 10, status?: string) =>
  useQuery({
    queryKey: ["orders", "my-orders", page, limit, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (status) params.append('status', status);
      return (await api.get(`/orders/my-orders?${params.toString()}`)).data;
    },
    enabled: !!(typeof window !== "undefined" && localStorage.getItem("token")),
  });

export const useGuestCheckout = () => {
  return useMutation({
    mutationFn: async (data: { 
      items: { furnitureId: number; quantity: number }[]; 
      guestInfo: { email: string; name?: string } 
    }) => (await api.post("/checkout/guest", data)).data,
  });
};

export const useGetUserProfile = (token: string | null) => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!token) return null;
      const res = await api.get("/auth/me");
      return res.data.data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // cache for 10 mins
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; email?: string }) => {
      const res = await api.put("/auth/profile", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    }
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await api.put("/auth/change-password", data);
      return res.data;
    }
  });
};

export const useRefreshToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (refreshToken: string) => {
      const res = await api.post("/auth/refresh", { refreshToken });
      return res.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    }
  });
};
// ---- Fetch Categories ----
export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      // Since there's no dedicated categories endpoint, we'll get unique categories from furniture
      const response = await api.get("/furnitures?limit=100");
      const furniture = response.data.data?.items || [];
      const categories = furniture.reduce((acc: Category[], item: Furniture) => {
        if (item.category && !acc.find(cat => cat.name === item.category!.name)) {
          acc.push({
            id: item.categoryId,
            name: item.category.name,
            description: item.category.description
          });
        }
        return acc;
      }, []);
      return categories;
    },
  });
// ---- Categories ----
// export const useCategories = () =>
//   useQuery({
//     queryKey: ["categories"],
//     queryFn: async () => (await api.get("/furnitures/categories")).data,
//     staleTime: 10 * 60 * 1000, // 10 minutes
//   });