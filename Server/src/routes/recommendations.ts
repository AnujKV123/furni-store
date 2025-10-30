import { Router } from "express";
import {
    getUserRecommendations,
    getPopularItems,
    getCategoryRecommendations,
    getSimilarRecommendations
} from "../controllers/recommendationController";

const r = Router();

// User-based recommendations
r.get("/user/:userId", getUserRecommendations);              // Personalized recommendations for user

// Content-based recommendations
r.get("/similar/:furnitureId", getSimilarRecommendations);   // Similar items to a specific furniture
r.get("/category/:categoryId", getCategoryRecommendations);  // Recommendations from specific category

// Popular recommendations (fallback)
r.get("/popular", getPopularItems);               // Popular items across all categories

export default r;