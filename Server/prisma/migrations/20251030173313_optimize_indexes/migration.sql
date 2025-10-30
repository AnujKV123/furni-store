-- CreateIndex
CREATE INDEX "Furniture_name_idx" ON "Furniture"("name");

-- CreateIndex
CREATE INDEX "Furniture_categoryId_createdAt_idx" ON "Furniture"("categoryId", "createdAt");

-- CreateIndex
CREATE INDEX "Furniture_price_createdAt_idx" ON "Furniture"("price", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "OrderItem_furnitureId_orderId_idx" ON "OrderItem"("furnitureId", "orderId");
