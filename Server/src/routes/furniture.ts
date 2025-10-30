import { Router } from "express";
import {
    listFurnitures, 
    getFurniture,
    createFurniture,
    updateFurniture,
    deleteFurniture,
    getRecommendations,
    getCategories
} from "../controllers/furnitureController";
import { 
  validateQuery, 
  validateParams, 
  validateBody,
  furnitureQuerySchema, 
  idParamSchema,
  createFurnitureSchema,
  updateFurnitureSchema
} from "../utils/validation";

const r = Router();

// Public routes
r.get("/", validateQuery(furnitureQuerySchema), listFurnitures);
r.get("/categories", getCategories);
r.get("/:id", validateParams(idParamSchema), getFurniture);
r.get("/recommendations/:id", validateParams(idParamSchema), getRecommendations);

// Admin routes (TODO: Add authentication middleware)
r.post("/", validateBody(createFurnitureSchema), createFurniture);
r.put("/:id", validateParams(idParamSchema), validateBody(updateFurnitureSchema), updateFurniture);
r.delete("/:id", validateParams(idParamSchema), deleteFurniture);

export default r;
