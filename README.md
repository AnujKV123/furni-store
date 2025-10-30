# 🪑 FurniStore - Modern Furniture E-Commerce Platform

A full-stack furniture e-commerce application built with Next.js, TypeScript, Express.js, and PostgreSQL. Features a modern, responsive design with comprehensive furniture browsing, user authentication, shopping cart, and order management.

## 🚀 Features

### 🛍️ **E-Commerce Core**
- **Product Catalog**: Browse furniture with advanced filtering and search
- **Product Details**: High-quality images, dimensions, specifications, and reviews
- **Shopping Cart**: Add/remove items, quantity management, persistent cart
- **Secure Checkout**: Authentication-required purchase flow with order tracking
- **Order Management**: View order history, track order status, order details

### 👤 **User Management**
- **Authentication**: Secure JWT-based login/register system
- **User Profiles**: Manage personal information and preferences
- **Order History**: Complete purchase history with detailed order information
- **Account Security**: Password management and secure sessions

### 🔍 **Advanced Features**
- **Smart Search**: Full-text search across product names and descriptions
- **Advanced Filtering**: Filter by category, price range, dimensions
- **Product Recommendations**: AI-powered similar product suggestions
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Live cart updates and inventory management

### 🎨 **User Experience**
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Loading States**: Smooth loading animations and skeleton screens
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Accessibility**: WCAG compliant design with proper ARIA labels
- **Performance**: Optimized images, lazy loading, and efficient caching

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Image Handling**: Next.js Image optimization

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Security**: Helmet, CORS, bcrypt

### **Development Tools**
- **Package Manager**: npm
- **Development Server**: Nodemon
- **Code Quality**: ESLint, Prettier
- **Type Checking**: TypeScript compiler
- **Database Management**: Prisma Studio

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher)
- **Git**

## 🚀 Quick Start

### 1. **Clone the Repository**
```bash
git clone https://github.com/AnujKV123/furni-store.git
cd furniture-ecommerce
```

### 2. **Install Dependencies** 

**Backend Setup:**
```bash
cd Server
npm install
```

**Frontend Setup:**
```bash
cd ../client
npm install
```

### 3. **Environment Configuration**

**Backend Environment (.env in Server directory):**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/furniture_store"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server Configuration
PORT=4000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

**Frontend Environment (.env.local in client directory):**
```env
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:4000/api"

# App Configuration
NEXT_PUBLIC_APP_NAME="FurniStore"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. **Database Setup**

**Create PostgreSQL Database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE furniture_store;

# Exit PostgreSQL
\q
```

**Run Database Migrations:**
```bash
cd Server
npx prisma migrate dev
npx prisma generate
```

**Seed Sample Data (Optional):**
```bash
# Start the server first, then in another terminal:
curl -X POST http://localhost:4000/api/system/seed-test-data
```

### 5. **Start the Application**

**Start Backend Server:**
```bash
cd Server
npm run dev
```
Server will run on: http://localhost:4000

**Start Frontend Application:**
```bash
cd client
npm run dev
```
Frontend will run on: http://localhost:3000

## 📁 Project Structure

```
furniture-ecommerce/
├── client/                          # Frontend Next.js application
│   ├── app/                         # Next.js App Router
│   │   ├── auth/                    # Authentication pages
│   │   │   ├── login/               # Login page
│   │   │   └── register/            # Registration page
│   │   ├── buy/[id]/                # Direct purchase page
│   │   ├── cart/                    # Shopping cart page
│   │   ├── components/              # Reusable React components
│   │   │   ├── ui/                  # Base UI components
│   │   │   ├── AddToCartButton.tsx  # Add to cart functionality
│   │   │   ├── ErrorBoundary.tsx    # Error handling component
│   │   │   ├── FurnitureCard.tsx    # Product card component
│   │   │   ├── Navbar.tsx           # Navigation component
│   │   │   ├── ReviewSection.tsx    # Product reviews
│   │   │   └── SearchAndFilter.tsx  # Search and filtering
│   │   ├── lib/                     # Utility libraries
│   │   │   ├── api.ts               # API client configuration
│   │   │   ├── queries.ts           # TanStack Query hooks
│   │   │   ├── types.ts             # TypeScript type definitions
│   │   │   └── utils.ts             # Utility functions
│   │   ├── order/                   # Order-related pages
│   │   │   ├── [id]/                # Order details page
│   │   │   ├── success/             # Order success page
│   │   │   └── summary/             # Order summary page
│   │   ├── orders/                  # Order history page
│   │   ├── product/[id]/            # Product detail page
│   │   ├── profile/                 # User profile page
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout component
│   │   ├── page.tsx                 # Home page
│   │   └── providers.tsx            # Context providers
│   ├── public/                      # Static assets
│   ├── next.config.js               # Next.js configuration
│   ├── package.json                 # Frontend dependencies
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   └── tsconfig.json                # TypeScript configuration
├── Server/                          # Backend Express.js application
│   ├── src/                         # Source code
│   │   ├── controllers/             # Route controllers
│   │   │   ├── authController.ts    # Authentication logic
│   │   │   ├── checkoutController.ts # Checkout and orders
│   │   │   ├── furnitureController.ts # Product management
│   │   │   ├── orderController.ts   # Order management
│   │   │   └── reviewController.ts  # Review system
│   │   ├── middleware/              # Express middleware
│   │   │   ├── authMiddleware.ts    # JWT authentication
│   │   │   ├── errorHandler.ts      # Error handling
│   │   │   └── requestLogger.ts     # Request logging
│   │   ├── routes/                  # API route definitions
│   │   │   ├── auth.ts              # Authentication routes
│   │   │   ├── cart.ts              # Shopping cart routes
│   │   │   ├── checkout.ts          # Checkout routes
│   │   │   ├── furniture.ts         # Product routes
│   │   │   ├── orders.ts            # Order routes
│   │   │   └── reviews.ts           # Review routes
│   │   ├── utils/                   # Utility functions
│   │   │   ├── errors.ts            # Error classes
│   │   │   ├── jwt.ts               # JWT utilities
│   │   │   ├── response.ts          # Response formatting
│   │   │   └── validation.ts        # Input validation
│   │   ├── app.ts                   # Express app configuration
│   │   ├── prisma.ts                # Prisma client setup
│   │   └── server.ts                # Server entry point
│   ├── prisma/                      # Database schema and migrations
│   │   ├── migrations/              # Database migration files
│   │   └── schema.prisma            # Prisma schema definition
│   ├── package.json                 # Backend dependencies
│   └── tsconfig.json                # TypeScript configuration
├── .gitignore                       # Git ignore rules
└── README.md                        # Project documentation
```

## 🔧 Available Scripts

### **Backend Scripts (Server directory)**
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:reset     # Reset database (development only)
```

### **Frontend Scripts (client directory)**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 🗄️ Database Schema

### **Core Tables**
- **Users**: User accounts and authentication
- **Categories**: Product categories (Chairs, Tables, Sofas, etc.)
- **Furniture**: Product catalog with details and pricing
- **Images**: Product images and media
- **Reviews**: Customer reviews and ratings
- **Carts**: Shopping cart management
- **CartItems**: Individual cart items
- **Orders**: Order information and status
- **OrderItems**: Individual order line items

### **Key Relationships**
- Users have many Orders and one Cart
- Furniture belongs to Categories and has many Images/Reviews
- Orders contain multiple OrderItems
- Carts contain multiple CartItems

## 🔐 API Endpoints

### **Authentication**
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/refresh      # Refresh JWT token
GET  /api/auth/me           # Get current user
```

### **Products**
```
GET  /api/furnitures        # List all furniture (with filtering)
GET  /api/furnitures/:id    # Get furniture details
GET  /api/furnitures/categories # Get all categories
GET  /api/furnitures/recommendations/:id # Get similar products
```

### **Shopping Cart**
```
GET    /api/cart            # Get user's cart
POST   /api/cart/add        # Add item to cart
PUT    /api/cart/update     # Update cart item quantity
DELETE /api/cart/remove     # Remove item from cart
DELETE /api/cart/clear      # Clear entire cart
```

### **Orders**
```
GET  /api/orders/my-orders  # Get user's orders
GET  /api/orders/:id        # Get order details
POST /api/checkout/place    # Create new order (authenticated users)
```

### **Reviews**
```
GET  /api/reviews/furniture/:id # Get product reviews
POST /api/reviews               # Add product review
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Zod schemas for all API inputs
- **CORS Protection**: Configured for specific origins
- **Helmet Security**: Security headers and protection
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization and validation
- **Rate Limiting**: API rate limiting (can be configured)

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Loading States**: Skeleton screens and loading indicators
- **Error Boundaries**: Graceful error handling and recovery
- **Toast Notifications**: User feedback for actions
- **Image Optimization**: Next.js Image component with lazy loading
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Dark Mode Ready**: CSS variables for easy theme switching

## 🚀 Deployment

### **Frontend Deployment (Vercel)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from client directory
cd client
vercel

# Set environment variables in Vercel dashboard
```

### **Backend Deployment (Railway/Heroku)**
```bash
# For Railway
railway login
railway init
railway add postgresql
railway deploy

# For Heroku
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### **Environment Variables for Production**
Update your environment variables for production URLs and secure secrets.

## 🧪 Testing

### **Manual Testing Checklist**
- [ ] User registration and login
- [ ] Product browsing and search
- [ ] Add/remove items from cart
- [ ] Complete purchase flow
- [ ] Order history viewing
- [ ] Product reviews
- [ ] Responsive design on mobile

### **API Testing**
```bash
# Test API endpoints
curl -X GET http://localhost:4000/api/health
curl -X GET http://localhost:4000/api/furnitures
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🆘 Troubleshooting

### **Common Issues**

**Database Connection Issues:**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check connection string in .env
echo $DATABASE_URL
```

**Port Already in Use:**
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Prisma Issues:**
```bash
# Reset Prisma client
npx prisma generate
npx prisma db push
```

**Node Modules Issues:**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Tailwind CSS for the utility-first CSS framework
- Lucide React for the beautiful icons
- TanStack Query for state management

---

**Built with ❤️ by the Anuj Verma**