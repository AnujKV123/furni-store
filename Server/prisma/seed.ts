import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data in correct order to avoid foreign key constraints
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.image.deleteMany();
  await prisma.furniture.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleared existing data");

  // Create sample users
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "john.doe@example.com",
        name: "John Doe",
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: "jane.smith@example.com",
        name: "Jane Smith",
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: "mike.wilson@example.com",
        name: "Mike Wilson",
        password: hashedPassword,
      },
    }),
  ]);

  console.log("👥 Created sample users");

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Living Room",
        description: "Comfortable furniture for living spaces",
      },
    }),
    prisma.category.create({
      data: {
        name: "Bedroom",
        description: "Furniture for restful bedrooms",
      },
    }),
    prisma.category.create({
      data: {
        name: "Dining Room",
        description: "Elegant dining furniture",
      },
    }),
    prisma.category.create({
      data: {
        name: "Office",
        description: "Professional office furniture",
      },
    }),
    prisma.category.create({
      data: {
        name: "Lighting",
        description: "Decorative and functional lighting",
      },
    }),
  ]);

  console.log("📂 Created categories");

  // Define furniture data with proper decimal values
  const furnitureData = [
    {
      name: "Ergonomic Office Chair",
      description: "Professional ergonomic chair with lumbar support, perfect for long work sessions",
      price: "249.99",
      sku: "CH-001",
      categoryName: "Office",
      widthCm: "70.00",
      heightCm: "110.00",
      depthCm: "70.00",
      images: [
        "https://static.vecteezy.com/system/resources/previews/033/504/399/large_2x/furniture-with-ai-generated-free-png.png",
        "https://example.com/chair-side.jpg",
      ],
    },
    {
      name: "Premium Leather Sofa Set",
      description: "Luxurious 3-piece leather sofa set with premium Italian leather upholstery",
      price: "1299.99",
      sku: "SS-001",
      categoryName: "Living Room",
      widthCm: "280.00",
      heightCm: "85.00",
      depthCm: "95.00",
      images: [
        "https://images.rawpixel.com/image_social_landscape/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTA4L3Jhd3BpeGVsb2ZmaWNlOF9waG90b19vZl9hX21pbmltYWxfZnVybml0dXJlX3NldF9uYXR1cmFsX2xpZ2h0X180YzcxYzU5ZC0yMWJiLTQyMjctYmYxZS1hMzdiZGJiYTc1YjhfMS5qcGc.jpg",
      ],
    },
    {
      name: "Modern Glass Dining Table",
      description: "Contemporary glass-top dining table with chrome legs, seats 6 people comfortably",
      price: "699.99",
      sku: "DT-001",
      categoryName: "Dining Room",
      widthCm: "210.00",
      heightCm: "75.00",
      depthCm: "100.00",
      images: [
        "https://images.rawpixel.com/image_social_landscape/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTA4L3Jhd3BpeGVsb2ZmaWNlMTJfY2xvc2VfdXBfcGhvdG9fb2ZfZGlubmluZ19yb29tX3NpbXBsZV9taW5pbWFsX19hYWJiODU3OS1lMGU0LTQ0NmUtOWI3YS05ODZkYTliNDJiMmFfMS5qcGc.jpg",
      ],
    },
    {
      name: "Velvet Accent Chair",
      description: "Elegant single-seater velvet chair with gold-finished legs, perfect accent piece",
      price: "349.99",
      sku: "AC-001",
      categoryName: "Living Room",
      widthCm: "90.00",
      heightCm: "85.00",
      depthCm: "80.00",
      images: [
        "https://img.freepik.com/premium-photo/grey-fabric-sofa-wooden-legs-isolated-white-background-with-clipping-path_1199132-44324.jpg",
      ],
    },
    {
      name: "Solid Oak Platform Bed",
      description: "Handcrafted solid oak platform bed with minimalist design and built-in nightstands",
      price: "999.99",
      sku: "BD-001",
      categoryName: "Bedroom",
      widthCm: "210.00",
      heightCm: "110.00",
      depthCm: "200.00",
      images: [
        "https://vivaninterio.com/wp-content/uploads/2020/05/H0f2ed785b50c4cb59c9bc5a3259a173cO.jpg",
      ],
    },
    {
      name: "Memory Foam Mattress Bed",
      description: "Complete bed set with premium memory foam mattress and adjustable base",
      price: "1299.00",
      sku: "BD-002",
      categoryName: "Bedroom",
      widthCm: "220.00",
      heightCm: "120.00",
      depthCm: "210.00",
      images: [
        "https://i5.walmartimages.com/asr/23171823-47c3-4b8b-a500-7aa3ec43feb1.b30a92741e7486b0089b88aad7cb6489.jpeg",
      ],
    },
    {
      name: "Walnut Bedside Table",
      description: "Elegant walnut bedside table with soft-close drawers and wireless charging pad",
      price: "199.99",
      sku: "NT-001",
      categoryName: "Bedroom",
      widthCm: "60.00",
      heightCm: "70.00",
      depthCm: "45.00",
      images: [
        "https://images.squarespace-cdn.com/content/v1/55bebb51e4b036c52ebe8c45/1624418148405-K4A2OZ25OFHLCQZL9NKE/elegant+bedside+table",
      ],
    },
    {
      name: "Sectional Sofa with Ottoman",
      description: "Large sectional sofa with matching ottoman, perfect for family gatherings",
      price: "1499.99",
      sku: "SS-002",
      categoryName: "Living Room",
      widthCm: "300.00",
      heightCm: "90.00",
      depthCm: "100.00",
      images: [
        "https://img.freepik.com/premium-photo/furniture-pictures_883586-22499.jpg",
      ],
    },
    {
      name: "Vintage Table Lamp",
      description: "Classic brass table lamp with fabric shade, perfect for reading nooks",
      price: "79.99",
      sku: "LP-001",
      categoryName: "Lighting",
      widthCm: "25.00",
      heightCm: "50.00",
      depthCm: "25.00",
      images: [
        "https://tse3.mm.bing.net/th/id/OIP.XtB2djbnDAzrI_T9Gv5WKwHaGa?rs=1&pid=ImgDetMain&o=7&rm=3",
      ],
    },
    {
      name: "Designer Floor Lamp",
      description: "Modern arc floor lamp with marble base and adjustable LED lighting",
      price: "149.99",
      sku: "LP-002",
      categoryName: "Lighting",
      widthCm: "30.00",
      heightCm: "60.00",
      depthCm: "30.00",
      images: [
        "https://m.media-amazon.com/images/I/819ffYEkCfL.jpg",
      ],
    },
    {
      name: "Executive Desk",
      description: "Large executive desk with built-in cable management and file drawers",
      price: "599.99",
      sku: "DK-001",
      categoryName: "Office",
      widthCm: "180.00",
      heightCm: "75.00",
      depthCm: "90.00",
      images: [
        "https://example.com/executive-desk.jpg",
      ],
    },
    {
      name: "Dining Chair Set",
      description: "Set of 4 upholstered dining chairs with solid wood frames",
      price: "399.99",
      sku: "DC-001",
      categoryName: "Dining Room",
      widthCm: "45.00",
      heightCm: "85.00",
      depthCm: "50.00",
      images: [
        "https://example.com/dining-chairs.jpg",
      ],
    },
  ];

  // Create furniture items
  const furnitureItems = [];
  for (const f of furnitureData) {
    const category = categories.find(c => c.name === f.categoryName);
    if (!category) continue;

    const furniture = await prisma.furniture.create({
      data: {
        name: f.name,
        description: f.description,
        price: f.price,
        sku: f.sku,
        widthCm: f.widthCm,
        heightCm: f.heightCm,
        depthCm: f.depthCm,
        categoryId: category.id,
        images: {
          create: f.images.map((url) => ({ url })),
        },
      },
    });
    furnitureItems.push(furniture);
  }

  console.log("🪑 Created furniture items");

  // Create sample orders
  const sampleOrders = [
    {
      userId: users[0].id,
      items: [
        { furnitureId: furnitureItems[0].id, quantity: 1, unitPrice: furnitureItems[0].price },
        { furnitureId: furnitureItems[2].id, quantity: 1, unitPrice: furnitureItems[2].price },
      ],
      status: "COMPLETED" as const,
    },
    {
      userId: users[1].id,
      items: [
        { furnitureId: furnitureItems[1].id, quantity: 1, unitPrice: furnitureItems[1].price },
      ],
      status: "COMPLETED" as const,
    },
    {
      userId: users[2].id,
      items: [
        { furnitureId: furnitureItems[4].id, quantity: 1, unitPrice: furnitureItems[4].price },
        { furnitureId: furnitureItems[6].id, quantity: 2, unitPrice: furnitureItems[6].price },
      ],
      status: "PENDING" as const,
    },
  ];

  for (const orderData of sampleOrders) {
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + parseFloat(item.unitPrice.toString()) * item.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        userId: orderData.userId,
        totalAmount: totalAmount.toString(),
        status: orderData.status,
        items: {
          create: orderData.items,
        },
      },
    });
  }

  console.log("📦 Created sample orders");

  // Create sample reviews for completed orders
  const sampleReviews = [
    {
      userId: users[0].id,
      furnitureId: furnitureItems[0].id,
      rating: 5,
      comment: "Excellent chair! Very comfortable for long work sessions. Highly recommended!",
    },
    {
      userId: users[0].id,
      furnitureId: furnitureItems[2].id,
      rating: 4,
      comment: "Beautiful dining table, great quality glass and sturdy construction.",
    },
    {
      userId: users[1].id,
      furnitureId: furnitureItems[1].id,
      rating: 5,
      comment: "Amazing sofa set! The leather quality is outstanding and very comfortable.",
    },
    {
      userId: users[2].id,
      furnitureId: furnitureItems[8].id,
      rating: 4,
      comment: "Nice lamp with good lighting. Perfect for reading corner.",
    },
  ];

  for (const reviewData of sampleReviews) {
    await prisma.review.create({
      data: reviewData,
    });
  }

  console.log("⭐ Created sample reviews");

  // Create sample carts
  for (const user of users) {
    await prisma.cart.create({
      data: {
        userId: user.id,
        items: {
          create: [
            {
              furnitureId: furnitureItems[Math.floor(Math.random() * furnitureItems.length)].id,
              quantity: Math.floor(Math.random() * 3) + 1,
            },
          ],
        },
      },
    });
  }

  console.log("🛒 Created sample carts");

  console.log("✅ Database seeding completed successfully!");
  console.log(`📊 Summary:`);
  console.log(`   - ${users.length} users created`);
  console.log(`   - ${categories.length} categories created`);
  console.log(`   - ${furnitureItems.length} furniture items created`);
  console.log(`   - ${sampleOrders.length} orders created`);
  console.log(`   - ${sampleReviews.length} reviews created`);
  console.log(`   - ${users.length} carts created`);
}

// Run safely
try {
  await main();
} catch (e) {
  console.error("❌ Error seeding database:", e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
