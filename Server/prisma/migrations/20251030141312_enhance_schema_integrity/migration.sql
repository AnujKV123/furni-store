/*
  Warnings:

  - You are about to alter the column `price` on the `Furniture` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `widthCm` on the `Furniture` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - You are about to alter the column `heightCm` on the `Furniture` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - You are about to alter the column `depthCm` on the `Furniture` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - You are about to alter the column `totalAmount` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `unitPrice` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[cartId,furnitureId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId,furnitureId]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,furnitureId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "quantity" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Furniture" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "widthCm" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "heightCm" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "depthCm" SET DATA TYPE DECIMAL(8,2);

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_furnitureId_idx" ON "CartItem"("furnitureId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_furnitureId_key" ON "CartItem"("cartId", "furnitureId");

-- CreateIndex
CREATE INDEX "Furniture_categoryId_idx" ON "Furniture"("categoryId");

-- CreateIndex
CREATE INDEX "Furniture_price_idx" ON "Furniture"("price");

-- CreateIndex
CREATE INDEX "Furniture_createdAt_idx" ON "Furniture"("createdAt");

-- CreateIndex
CREATE INDEX "Furniture_categoryId_price_idx" ON "Furniture"("categoryId", "price");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_furnitureId_idx" ON "OrderItem"("furnitureId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_furnitureId_key" ON "OrderItem"("orderId", "furnitureId");

-- CreateIndex
CREATE INDEX "Review_furnitureId_idx" ON "Review"("furnitureId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Review_furnitureId_rating_idx" ON "Review"("furnitureId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_furnitureId_key" ON "Review"("userId", "furnitureId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
