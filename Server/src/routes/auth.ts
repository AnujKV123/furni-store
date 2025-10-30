import { Router } from "express";
import {register, login, me, updateProfile, changePassword, refreshToken} from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";
import { 
  validateBody, 
  registerSchema, 
  loginSchema, 
  updateProfileSchema, 
  changePasswordSchema, 
  refreshTokenSchema 
} from "../utils/validation";

const r = Router();

r.post("/register", validateBody(registerSchema), register);
r.post("/login", validateBody(loginSchema), login);
r.post("/refresh", validateBody(refreshTokenSchema), refreshToken);
r.get("/me", authMiddleware, me);
r.put("/profile", authMiddleware, validateBody(updateProfileSchema), updateProfile);
r.put("/change-password", authMiddleware, validateBody(changePasswordSchema), changePassword);

export default r;
