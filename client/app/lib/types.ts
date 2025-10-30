export interface Furniture {
  id: number;
  name: string;
  description?: string;
  price: number;
  sku: string;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  categoryId: number;
  category?: {
    name: string;
    description?: string;
  };
  images: Image[];
  reviews?: Review[];
  averageRating?: number | null;
  reviewCount?: number;
  createdAt: string;
}

export interface Image {
  id: number;
  url: string;
  furnitureId: number;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  userId: number;
  furnitureId: number;
  user?: {
    name?: string;
    email: string;
  };
  createdAt: string;
}

export interface Order {
  id: number;
  userId?: number;
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  items: OrderItem[];
  user?: {
    id: number;
    name?: string;
    email: string;
  };
}

export interface OrderItem {
  id: number;
  orderId: number;
  furnitureId: number;
  quantity: number;
  unitPrice: number;
  furniture: Furniture;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  cartId: number;
  furnitureId: number;
  quantity: number;
  furniture: Furniture;
}
export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface FurnitureListResponse {
  success: boolean;
  data: {
    items: Furniture[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  priceRange?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RecommendationResponse {
  recommendations: Furniture[];
  algorithm: string;
  metadata?: {
    userHasPurchaseHistory: boolean;
    fallbackUsed: boolean;
    totalRecommendations: number;
  };
}