import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { placeOrder, guestCheckout } from "../controllers/checkoutController";

const r = Router();

r.post("/place", authMiddleware, placeOrder); // create order from current user's cart
r.post("/guest", authMiddleware, guestCheckout); // guest checkout disabled - requires authentication

export default r;
