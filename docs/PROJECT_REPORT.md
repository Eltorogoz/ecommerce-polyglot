# E-Commerce Platform with Polyglot Persistence
## Database Systems Project Report

**Student:** Kris Valladares  
**Project:** Polyglot Persistence E-Commerce Application  
**Dataset:** Brazilian E-Commerce (Olist) from Kaggle

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Introduction](#2-introduction)
3. [System Architecture](#3-system-architecture)
4. [Database Design](#4-database-design)
5. [Data Model Rationale](#5-data-model-rationale)
6. [Implementation Details](#6-implementation-details)
7. [MongoDB Aggregation](#7-mongodb-aggregation)
8. [Dataset Integration](#8-dataset-integration)
9. [Frontend Interface](#9-frontend-interface)
10. [Testing & Results](#10-testing--results)
11. [Conclusion](#11-conclusion)

---

## 1. Executive Summary

This project implements a fully functional e-commerce platform demonstrating **polyglot persistence** — the strategic use of multiple database technologies within a single application. 

**Key Achievements:**
- PostgreSQL (Supabase): 4 tables with 300 users, 300 orders, 110 order items, 300 payments
- MongoDB Atlas: 2 collections with 100 products and reviews
- React frontend with full CRUD operations
- MongoDB aggregation pipelines for analytics
- Real-world dataset integration (Brazilian E-Commerce from Kaggle)

---

## 2. Introduction

### 2.1 Problem Statement

Modern e-commerce platforms handle diverse data types with varying requirements:
- **User accounts and payments** require ACID compliance
- **Product catalogs** need flexible schemas for varying attributes
- **Reviews** benefit from aggregation capabilities

### 2.2 Project Objectives

1. Design relational schema for transactional data (PostgreSQL)
2. Design document schema for flexible data (MongoDB)
3. Build API interfacing with both databases
4. Implement MongoDB aggregation pipelines
5. Create React frontend demonstrating all functionality
6. Integrate real-world Kaggle dataset

### 2.3 Value Proposition

- **Data Integrity:** Financial transactions protected by PostgreSQL ACID
- **Flexibility:** Products with varying attributes stored in MongoDB
- **Real Data:** Brazilian E-Commerce dataset with 99,441 real orders

---

## 3. System Architecture

### 3.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Tailwind)                 │
│                        localhost:3000                           │
│  Pages: Home | Products | Users | Orders                        │
└─────────────────────────────────────────────────────────────────┘
                                │ HTTP/REST
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)                   │
│                        localhost:5001                           │
│  Routes: /api/users | /api/orders | /api/products | /api/reviews│
└─────────────────────────────────────────────────────────────────┘
               │                                 │
               ▼                                 ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐
│   PostgreSQL (Supabase)  │    │        MongoDB Atlas             │
│                          │    │                                  │
│   • users (300)          │    │   • products (100)               │
│   • orders (300)         │    │   • reviews                      │
│   • order_items (110)    │    │                                  │
│   • payments (300)       │    │                                  │
└──────────────────────────┘    └──────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + Vite | User interface |
| Styling | Tailwind CSS | Responsive design |
| Backend | Node.js + Express | REST API |
| SQL DB | PostgreSQL (Supabase) | Transactional data |
| NoSQL DB | MongoDB Atlas | Flexible data |
| Dataset | Kaggle (Olist) | Real e-commerce data |

---

## 4. Database Design

### 4.1 PostgreSQL Schema (ER Diagram)

```
┌──────────────────┐          ┌──────────────────────┐
│      USERS       │          │       ORDERS         │
├──────────────────┤          ├──────────────────────┤
│ * id (PK)        │──────┐   │ * id (PK)            │
│   email (UNIQUE) │      │   │   user_id (FK) ──────┼────┐
│   password_hash  │      └───│   status             │    │
│   name           │          │   total_amount       │    │
│   created_at     │          │   shipping_address   │    │
└──────────────────┘          └──────────────────────┘    │
                                        │                 │
                                        │ 1:N             │
                                        ▼                 │
┌──────────────────────┐      ┌──────────────────────┐    │
│      PAYMENTS        │      │    ORDER_ITEMS       │    │
├──────────────────────┤      ├──────────────────────┤    │
│ * id (PK)            │      │ * id (PK)            │    │
│   order_id (FK) ─────┼──────│   order_id (FK)      │    │
│   amount             │      │   product_id ────────┼────┼──► MongoDB
│   payment_method     │      │   product_name       │    │
│   status             │      │   quantity           │    │
│   transaction_id     │      │   unit_price         │    │
└──────────────────────┘      └──────────────────────┘    │
```

### 4.2 Table Specifications

**users (300 records)**
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**orders (300 records)**
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INTEGER | FK → users(id) |
| status | VARCHAR(50) | CHECK constraint |
| total_amount | DECIMAL(10,2) | |
| shipping_address | TEXT | |

**order_items (110 records)**
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| order_id | INTEGER | FK → orders(id) |
| product_id | VARCHAR(24) | MongoDB ObjectId |
| product_name | VARCHAR(255) | Denormalized |
| quantity | INTEGER | CHECK (> 0) |
| unit_price | DECIMAL(10,2) | |

**payments (300 records)**
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| order_id | INTEGER | FK → orders(id) |
| amount | DECIMAL(10,2) | |
| payment_method | VARCHAR(50) | CHECK constraint |
| status | VARCHAR(50) | |

### 4.3 MongoDB Schema

**products collection (100 documents)**
```javascript
{
  _id: ObjectId,
  name: String,           // "Health Beauty Item #1"
  description: String,
  price: Number,          // 53.50
  category: String,       // "Health Beauty"
  stock: Number,
  isActive: Boolean,
  images: Array,
  attributes: Object,     // Flexible key-value pairs
  createdAt: Date,
  updatedAt: Date
}
```

**reviews collection**
```javascript
{
  _id: ObjectId,
  productId: ObjectId,    // Reference to products
  userId: Number,         // Reference to PostgreSQL users
  userName: String,       // Denormalized
  rating: Number,         // 1-5
  title: String,
  comment: String,
  helpfulVotes: Number,
  isVerifiedPurchase: Boolean,
  createdAt: Date
}
```

---

## 5. Data Model Rationale

### Why PostgreSQL for Users, Orders, Payments?

| Requirement | PostgreSQL Strength |
|-------------|---------------------|
| Unique emails | UNIQUE constraint enforced atomically |
| Order integrity | ACID transactions (all-or-nothing) |
| Payment audit | Referential integrity, consistent state |
| Complex queries | Efficient JOINs across tables |

### Why MongoDB for Products, Reviews?

| Requirement | MongoDB Strength |
|-------------|------------------|
| Varying attributes | Flexible schema per product category |
| Text search | Built-in text indexes |
| Analytics | Aggregation pipeline |
| Nested data | Native document embedding |

### Cross-Database Reference Strategy

| Reference | Implementation |
|-----------|----------------|
| order_items → products | MongoDB ObjectId as VARCHAR(24) |
| reviews → users | PostgreSQL ID as Number in MongoDB |

---

## 6. Implementation Details

### 6.1 API Endpoints

| Endpoint | Method | Database | Description |
|----------|--------|----------|-------------|
| /api/users | CRUD | PostgreSQL | User management |
| /api/orders | CRUD | PostgreSQL | Order management |
| /api/products | CRUD | MongoDB | Product catalog |
| /api/reviews | CRUD | MongoDB | Customer reviews |
| /api/products/analytics/top-rated | GET | MongoDB | Aggregation |
| /api/products/:id/rating-summary | GET | MongoDB | Aggregation |

### 6.2 Cross-Database Order Creation

```javascript
async function createOrder(req, res) {
  const client = await db.getClient();
  
  await client.query('BEGIN');
  
  // Create order in PostgreSQL
  const order = await client.query(
    'INSERT INTO orders (user_id, status) VALUES ($1, $2) RETURNING *',
    [userId, 'pending']
  );
  
  for (const item of items) {
    // Fetch product from MongoDB
    const product = await Product.findById(item.productId);
    
    // Insert item into PostgreSQL
    await client.query(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES ($1, $2, $3, $4, $5)',
      [order.id, item.productId, product.name, item.quantity, product.price]
    );
  }
  
  await client.query('COMMIT');
}
```

---

## 7. MongoDB Aggregation

### 7.1 Top Rated Products

```javascript
const topRated = await Review.aggregate([
  { $group: {
      _id: '$productId',
      avgRating: { $avg: '$rating' },
      reviewCount: { $sum: 1 }
  }},
  { $sort: { avgRating: -1 } },
  { $limit: 5 },
  { $lookup: {
      from: 'products',
      localField: '_id',
      foreignField: '_id',
      as: 'product'
  }},
  { $unwind: '$product' },
  { $project: {
      name: '$product.name',
      avgRating: 1,
      reviewCount: 1
  }}
]);
```

### 7.2 Rating Summary with $facet

```javascript
const summary = await Review.aggregate([
  { $match: { productId: ObjectId(productId) } },
  { $facet: {
      overall: [{
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }],
      distribution: [{
        $group: { _id: '$rating', count: { $sum: 1 } }
      }],
      recentReviews: [
        { $sort: { createdAt: -1 } },
        { $limit: 5 }
      ]
  }}
]);
```

**Key Operators Used:**
- `$group` - Group documents and calculate aggregates
- `$avg` - Calculate average rating
- `$sort` - Sort results
- `$lookup` - Join with products collection
- `$facet` - Run multiple aggregations in parallel

---

## 8. Dataset Integration

### 8.1 Source Dataset

**Brazilian E-Commerce Public Dataset by Olist**
- Source: Kaggle
- URL: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
- Size: 99,441 orders, 32,951 products, 112,650 order items

### 8.2 Data Transformation

Created `transform-olist.js` script to:
1. Load Olist CSV files
2. Map customer IDs to sequential user IDs
3. Generate names and emails for users
4. Map product IDs to MongoDB format
5. Transform order status values
6. Generate payment records
7. Export as Supabase CSVs and MongoDB JSON

### 8.3 Imported Data Summary

| Database | Table/Collection | Records |
|----------|------------------|---------|
| PostgreSQL | users | 300 |
| PostgreSQL | orders | 300 |
| PostgreSQL | order_items | 110 |
| PostgreSQL | payments | 300 |
| MongoDB | products | 100 |
| MongoDB | reviews | varies |

---

## 9. Frontend Interface

### 9.1 Pages

| Page | Functionality |
|------|---------------|
| **Home** | System health status, architecture overview |
| **Products** | Browse/create/edit products, view top-rated |
| **Users** | User management with CRUD operations |
| **Orders** | Create orders, update status, view items |

### 9.2 Key Features

- Real-time health check showing database connections
- Product cards with inline editing
- Order creation with user and product selection
- Status workflow (pending → processing → shipped → delivered)

---

## 10. Testing & Results

### 10.1 CRUD Operations Verified

| Operation | PostgreSQL | MongoDB |
|-----------|------------|---------|
| CREATE | ✅ Users, Orders | ✅ Products |
| READ | ✅ All tables | ✅ All collections |
| UPDATE | ✅ User info, Order status | ✅ Product details |
| DELETE | ✅ Cascade working | ✅ Soft delete |

### 10.2 Health Check Response

```json
{
  "ok": true,
  "postgres": true,
  "mongodb": true,
  "timestamp": "2026-04-30T05:00:00.000Z"
}
```

### 10.3 Aggregation Results

Top Rated Products endpoint returns products ranked by average review rating with review counts.

---

## 11. Conclusion

### 11.1 Achievements

✅ Implemented polyglot persistence with PostgreSQL + MongoDB  
✅ Designed proper schemas for each database type  
✅ Built full CRUD API for all entities  
✅ Implemented MongoDB aggregation ($group, $facet, $lookup)  
✅ Created modern React frontend  
✅ Integrated real Kaggle dataset  

### 11.2 Key Learnings

1. **Database selection matters** - Different data needs different databases
2. **Aggregation pipelines are powerful** - Complex analytics in single queries
3. **Cross-database coordination** - Requires careful ID mapping and denormalization

### 11.3 Future Improvements

- Add user authentication (JWT)
- Implement shopping cart
- Add payment gateway integration
- Real-time updates with WebSockets

---

## Appendix

### A. GitHub Repository

https://github.com/Eltorogoz/ecommerce-polyglot

### B. Running the Application

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

### C. Environment Variables

```env
PORT=5001
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb+srv://...
```
