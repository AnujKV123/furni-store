import express from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import furnitureRoutes from "./routes/furniture";
import orderRoutes from "./routes/orders";
import reviewRoutes from "./routes/reviews";
import authRoutes from "./routes/auth";
import cartRoutes from "./routes/cart";
import checkoutRoutes from "./routes/checkout";
import recommendationRoutes from "./routes/recommendations";
import performanceRoutes from "./routes/performance";
import systemRoutes from "./routes/system";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { apiPerformanceMiddleware } from "./middleware/performanceMonitor";

const app = express();

const { json, urlencoded } = bodyParser;

app.use(helmet());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// Add request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Add performance monitoring
app.use(apiPerformanceMiddleware);

app.use("/api/furnitures", furnitureRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/system", systemRoutes);

// health
app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;
