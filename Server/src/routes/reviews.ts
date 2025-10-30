import { Router } from "express";
import {
    createReview, 
    getReviewsForFurniture,
    getUserReviews,
    updateReview,
    deleteReview,
    canUserReview
} from "../controllers/reviewController";

const r = Router();

// Review CRUD operations
r.post("/", createReview);                                    // Create review
r.put("/:id", updateReview);                                  // Update review
r.delete("/:id", deleteReview);                               // Delete review

// Get reviews
r.get("/furniture/:id", getReviewsForFurniture);              // Get reviews for furniture
r.get("/user/:userId", getUserReviews);                       // Get reviews by user

// Review eligibility check
r.get("/can-review/:userId/:furnitureId", canUserReview);     // Check if user can review

export default r;
