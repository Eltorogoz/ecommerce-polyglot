# E-Commerce Polyglot Persistence Platform

A university demo showcasing **polyglot persistence** — using multiple database technologies, each optimized for specific data patterns.

## Architecture Overview

### Why Polyglot Persistence?

Different data has different access patterns, consistency requirements, and schema flexibility needs. This platform demonstrates when to use SQL vs NoSQL:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│                    Vite + Tailwind CSS                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)                   │
│                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐│
│  │    SQL Module (pg)      │    │   NoSQL Module (Mongoose)   ││
│  │                         │    │                             ││
│  │  • Users                │    │  • Products                 ││
│  │  • Orders               │    │  • Reviews                  ││
│  │  • Order Items          │    │                             ││
│  │  • Payments             │    │                             ││
│  └───────────┬─────────────┘    └──────────────┬──────────────┘│
└──────────────┼─────────────────────────────────┼────────────────┘
               ▼                                 ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐
│   PostgreSQL (Supabase)  │    │        MongoDB Atlas             │
│                          │    │                                  │
│   ACID Transactions      │    │   Flexible Schema                │
│   Strong Consistency     │    │   Rich Aggregations              │
│   Referential Integrity  │    │   Nested Documents               │
└──────────────────────────┘    └──────────────────────────────────┘
```

### Data Split Rationale

| Data Type | Database | Reasoning |
|-----------|----------|-----------|
| **Users** | PostgreSQL | Requires strong consistency, unique email constraints, password security |
| **Orders** | PostgreSQL | Financial transactions need ACID guarantees, referential integrity with users |
| **Order Items** | PostgreSQL | Part of order transaction, linked to orders via FK |
| **Payments** | PostgreSQL | Critical financial data, audit requirements |
| **Products** | MongoDB | Varying attributes per category (electronics vs clothing), flexible schema |
| **Reviews** | MongoDB | Nested data, text-heavy, benefits from aggregation pipelines |

### Cross-Database References

- **Order Items → Products**: `product_id` stored as MongoDB ObjectId string in PostgreSQL
- **Reviews → Users**: `userId` (SQL integer) stored in MongoDB documents
- Product names denormalized in order_items for display without cross-DB joins

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express
- **SQL Database**: PostgreSQL via Supabase (using `pg` driver)
- **NoSQL Database**: MongoDB Atlas (using Mongoose ODM)

## Project Structure

```
ecommerce-polyglot/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   │   ├── userController.js
│   │   │   ├── orderController.js
│   │   │   ├── productController.js
│   │   │   └── reviewController.js
│   │   ├── db/
│   │   │   ├── postgres.js  # PostgreSQL connection
│   │   │   ├── mongodb.js   # MongoDB connection
│   │   │   └── schema.sql   # SQL DDL
│   │   ├── models/          # Mongoose schemas
│   │   │   ├── Product.js
│   │   │   └── Review.js
│   │   ├── routes/          # Express routers
│   │   └── index.js         # Entry point
│   ├── .env                 # Local config (not in git)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js    # API wrapper
│   │   ├── pages/           # React pages
│   │   └── App.jsx
│   ├── .env
│   └── .env.example
└── README.md
```

## Setup Instructions

### 1. Clone and Install

```bash
cd ecommerce-polyglot

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install
```

### 2. Configure Environment

Edit `backend/.env` with your credentials:

```env
PORT=5001
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
```

### 3. Initialize PostgreSQL Schema

Run the SQL in `backend/src/db/schema.sql` via:
- Supabase Dashboard → SQL Editor
- Or: `psql $DATABASE_URL -f backend/src/db/schema.sql`

### 4. Run the Application

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## API Reference

### Health Check
```
GET /api/health
→ { ok: true, postgres: true, mongodb: true }
```

### Users (PostgreSQL)
```
GET    /api/users           # List all users
GET    /api/users/:id       # Get user by ID
POST   /api/users           # Create user { email, name, password }
PUT    /api/users/:id       # Update user
DELETE /api/users/:id       # Delete user
```

### Orders (PostgreSQL)
```
GET    /api/orders          # List all orders with items
GET    /api/orders/:id      # Get order by ID
POST   /api/orders          # Create order { userId, items: [{productId, quantity}] }
PUT    /api/orders/:id      # Update order status
GET    /api/orders/user/:userId  # Get orders by user
```

### Products (MongoDB)
```
GET    /api/products        # List products (?category=, ?search=, ?sort=)
GET    /api/products/:id    # Get product with reviews
POST   /api/products        # Create product { name, price, stock, category, description }
PUT    /api/products/:id    # Update product
DELETE /api/products/:id    # Soft delete (sets isActive=false)
```

### Reviews (MongoDB)
```
GET    /api/reviews                    # List reviews (?productId=, ?userId=)
GET    /api/reviews/:id                # Get review
POST   /api/reviews                    # Create review { productId, userId, rating, comment }
PUT    /api/reviews/:id                # Update review
DELETE /api/reviews/:id                # Delete review
POST   /api/reviews/:id/helpful        # Vote helpful
GET    /api/reviews/product/:productId # Reviews for product
```

### Analytics (MongoDB Aggregation)
```
GET /api/products/analytics/top-rated    # Top rated products
GET /api/products/:id/rating-summary     # Rating distribution and stats
```

## Sample API Calls

```bash
# Create a user
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"secret123"}'

# Create a product
curl -X POST http://localhost:5001/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999.99,"stock":10,"category":"Electronics"}'

# Create an order (replace IDs)
curl -X POST http://localhost:5001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"items":[{"productId":"MONGO_PRODUCT_ID","quantity":2}]}'

# Get top rated products
curl http://localhost:5001/api/products/analytics/top-rated
```

## Advanced MongoDB Aggregation

The platform includes advanced aggregation pipelines:

### Top Rated Products
Aggregates reviews, calculates average ratings, and joins with product data.

### Rating Summary
Uses `$facet` to compute in a single query:
- Overall statistics (avg rating, total reviews)
- Rating distribution (1-5 stars)
- Recent reviews

## License

MIT — University project for educational purposes.
