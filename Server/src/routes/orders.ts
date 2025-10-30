import { Router } from "express";
import { 
    createOrder, 
    getOrder, 
    updateOrderStatus,
    getUserOrders,
    getAllOrders,
    getMyOrders
} from "../controllers/orderController";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/authMiddleware";

const r = Router();

// Order management
r.post("/", optionalAuthMiddleware, createOrder);    // Create new order (supports guest checkout)
r.get("/", authMiddleware, getAllOrders);            // Get all orders (admin only)

// User-specific orders (must come before /:id route)
r.get("/my-orders", authMiddleware, getMyOrders); // Get current user's orders
r.get("/user/:userId", authMiddleware, getUserOrders); // Get orders for specific user (authenticated only)

// Order by ID (must come after specific routes)
r.get("/:id", optionalAuthMiddleware, getOrder);     // Get order by ID (owner or guest with order ID)
r.patch("/:id/status", authMiddleware, updateOrderStatus); // Update order status (admin only)

export default r;
