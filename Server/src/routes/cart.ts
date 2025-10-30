import { Router } from "express";
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from "../controllers/cartController";
import { authMiddleware } from "../middleware/authMiddleware";

const r = Router();

r.use(authMiddleware); // all cart routes require auth
r.get("/", getCart);
r.post("/add", addToCart); // { furnitureId, quantity }
r.post("/update", updateCartItem); // { cartItemId, quantity }
r.delete("/remove/:cartItemId", removeCartItem);
r.post("/clear", clearCart);

export default r;
