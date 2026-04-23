# E-Commerce Platform with Polyglot Persistence
## Database Systems Project Report

**Course:** Database Systems  
**Project:** Polyglot Persistence E-Commerce Application  
**Technology Stack:** PostgreSQL, MongoDB, Node.js, React

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Introduction](#2-introduction)
3. [System Architecture](#3-system-architecture)
4. [Database Design](#4-database-design)
5. [Data Model Rationale](#5-data-model-rationale)
6. [Implementation Details](#6-implementation-details)
7. [MongoDB Aggregation](#7-mongodb-aggregation)
8. [Frontend Interface](#8-frontend-interface)
9. [Use Cases](#9-use-cases)
10. [Testing and Validation](#10-testing-and-validation)
11. [Conclusion](#11-conclusion)
12. [Appendix](#appendix)

---

## 1. Executive Summary

This project implements a fully functional e-commerce platform demonstrating **polyglot persistence**—the strategic use of multiple database technologies within a single application. The platform uses PostgreSQL (via Supabase) for transactional data requiring ACID compliance and MongoDB Atlas for flexible, document-oriented product and review data.

The application provides complete CRUD (Create, Read, Update, Delete) operations on both databases, advanced MongoDB aggregation pipelines for analytics, and a modern React-based frontend interface.

**Key Deliverables:**
- PostgreSQL database with 4 tables (users, orders, order_items, payments)
- MongoDB database with 2 collections (products, reviews)
- RESTful API with 20+ endpoints
- React frontend with 4 interactive pages
- MongoDB aggregation for rating analytics

---

## 2. Introduction

### 2.1 Problem Statement

Modern e-commerce platforms handle diverse data types with varying requirements:
- **User accounts and financial transactions** require strong consistency and ACID guarantees
- **Product catalogs** need flexible schemas to accommodate varying attributes across categories
- **Customer reviews** benefit from document-oriented storage and aggregation capabilities

A single database technology cannot optimally serve all these needs. This project demonstrates how polyglot persistence addresses this challenge.

### 2.2 Project Objectives

1. Design and implement a relational database schema for transactional data
2. Design and implement a MongoDB document schema for flexible data
3. Build a backend API that interfaces with both databases
4. Implement MongoDB aggregation pipelines for analytics
5. Create a frontend interface demonstrating all functionalities

### 2.3 Value Proposition

This e-commerce platform provides value through:
- **Data Integrity**: Financial transactions are protected by PostgreSQL's ACID compliance
- **Flexibility**: Products with varying attributes are stored efficiently in MongoDB
- **Performance**: Each database is optimized for its specific workload
- **Scalability**: The architecture supports independent scaling of each data store

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                     │
│                        Tailwind CSS                             │
│                     http://localhost:3000                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/REST
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)                   │
│                     http://localhost:5001                       │
│                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐│
│  │   PostgreSQL Module     │    │     MongoDB Module          ││
│  │   (pg driver)           │    │     (Mongoose ODM)          ││
│  └───────────┬─────────────┘    └──────────────┬──────────────┘│
└──────────────┼─────────────────────────────────┼────────────────┘
               │                                 │
               ▼                                 ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐
│   PostgreSQL (Supabase)  │    │        MongoDB Atlas             │
│                          │    │                                  │
│   • users                │    │   • products                     │
│   • orders               │    │   • reviews                      │
│   • order_items          │    │                                  │
│   • payments             │    │                                  │
└──────────────────────────┘    └──────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 | User interface components |
| Frontend | Vite | Build tool and dev server |
| Frontend | Tailwind CSS | Utility-first styling |
| Frontend | React Router | Client-side navigation |
| Backend | Node.js | JavaScript runtime |
| Backend | Express | Web framework |
| Backend | pg | PostgreSQL driver |
| Backend | Mongoose | MongoDB ODM |
| Database | PostgreSQL (Supabase) | Relational data |
| Database | MongoDB Atlas | Document data |

### 3.3 Project Structure

```
ecommerce-polyglot/
├── backend/
│   ├── src/
│   │   ├── controllers/          # Business logic
│   │   │   ├── userController.js
│   │   │   ├── orderController.js
│   │   │   ├── productController.js
│   │   │   └── reviewController.js
│   │   ├── db/
│   │   │   ├── postgres.js       # PostgreSQL connection
│   │   │   ├── mongodb.js        # MongoDB connection
│   │   │   └── schema.sql        # SQL DDL statements
│   │   ├── models/               # Mongoose schemas
│   │   │   ├── Product.js
│   │   │   └── Review.js
│   │   ├── routes/               # API routes
│   │   │   ├── users.js
│   │   │   ├── orders.js
│   │   │   ├── products.js
│   │   │   └── reviews.js
│   │   └── index.js              # Application entry point
│   ├── .env                      # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # API client
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Users.jsx
│   │   │   └── Orders.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── docs/
│   ├── er-diagram.md
│   ├── use-cases.md
│   └── PROJECT_REPORT.md
└── README.md
```

---

## 4. Database Design

### 4.1 PostgreSQL Schema (Relational Database)

#### Entity-Relationship Diagram

```
    ┌──────────────────┐          ┌──────────────────────┐
    │      USERS       │          │       ORDERS         │
    ├──────────────────┤          ├──────────────────────┤
    │ * id (PK)        │──────┐   │ * id (PK)            │
    │   email (UNIQUE) │      │   │   user_id (FK)  ─────┼────┐
    │   password_hash  │      └───│   status             │    │
    │   name           │          │   total_amount       │    │
    │   created_at     │          │   shipping_address   │    │
    │   updated_at     │          │   created_at         │    │
    └──────────────────┘          │   updated_at         │    │
                                  └──────────────────────┘    │
                                            │                 │
                                            │ 1:N             │ 1:N
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
    │   created_at         │      │   created_at         │    │
    │   updated_at         │      └──────────────────────┘    │
    └──────────────────────┘                                  │
                                                              │
    Legend: * = Primary Key, (FK) = Foreign Key               │
```

#### Table Specifications

**users**
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**orders**
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INTEGER | FOREIGN KEY → users(id), NOT NULL |
| status | VARCHAR(50) | CHECK (pending, processing, shipped, delivered, cancelled) |
| total_amount | DECIMAL(10,2) | DEFAULT 0.00 |
| shipping_address | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**order_items**
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| order_id | INTEGER | FOREIGN KEY → orders(id), NOT NULL |
| product_id | VARCHAR(24) | NOT NULL (MongoDB ObjectId) |
| product_name | VARCHAR(255) | Denormalized for display |
| quantity | INTEGER | CHECK (> 0), NOT NULL |
| unit_price | DECIMAL(10,2) | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**payments**
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| order_id | INTEGER | FOREIGN KEY → orders(id), NOT NULL |
| amount | DECIMAL(10,2) | NOT NULL |
| payment_method | VARCHAR(50) | CHECK (credit_card, debit_card, paypal, bank_transfer) |
| status | VARCHAR(50) | CHECK (pending, completed, failed, refunded) |
| transaction_id | VARCHAR(255) | External payment reference |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

#### Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### 4.2 MongoDB Schema (Document Database)

#### Products Collection

```javascript
{
  _id: ObjectId,                    // Auto-generated unique identifier
  name: {
    type: String,
    required: true,
    maxlength: 255
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    default: 'Uncategorized'
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{                        // Nested array of objects
    url: String,
    alt: String
  }],
  attributes: {                     // Flexible key-value pairs
    type: Map,
    of: Mixed
  },
  tags: [String],                   // Array of strings
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: Date,                  // Auto-managed timestamp
  updatedAt: Date                   // Auto-managed timestamp
}

// Indexes
{ name: 'text', description: 'text' }  // Full-text search
{ category: 1 }                         // Category filtering
{ price: 1 }                            // Price sorting
{ isActive: 1 }                         // Active product filtering
```

#### Reviews Collection

```javascript
{
  _id: ObjectId,
  productId: {
    type: ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {                         // Cross-database reference
    type: Number,                   // PostgreSQL users.id
    required: true
  },
  userName: {                       // Denormalized from PostgreSQL
    type: String,
    default: 'Anonymous'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    maxlength: 255
  },
  comment: {
    type: String,
    maxlength: 2000
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ productId: 1 }                        // Reviews by product
{ userId: 1 }                           // Reviews by user
{ rating: -1 }                          // Sort by rating
{ createdAt: -1 }                       // Sort by date
{ productId: 1, userId: 1 } unique      // One review per user per product
```

---

## 5. Data Model Rationale

### 5.1 Why Polyglot Persistence?

Different data types have fundamentally different requirements:

| Requirement | PostgreSQL | MongoDB |
|-------------|------------|---------|
| ACID Transactions | ✅ Native support | Limited |
| Flexible Schema | ❌ Fixed columns | ✅ Dynamic fields |
| Complex Joins | ✅ Efficient | Requires $lookup |
| Nested Data | ❌ Requires joins | ✅ Native embedding |
| Text Search | Requires extensions | ✅ Built-in |
| Aggregation | GROUP BY | ✅ Aggregation Pipeline |

### 5.2 Data Placement Decisions

#### PostgreSQL (Relational) — Transactional Data

**Users**
- Email uniqueness must be enforced atomically
- Password security requires consistent storage
- User data rarely changes structure
- Referenced by orders (foreign key integrity)

**Orders & Order Items**
- Financial transactions require ACID guarantees
- Order creation must be atomic (all items or none)
- Total calculation must be consistent
- Referential integrity with users

**Payments**
- Critical financial data requiring audit trails
- Status transitions must be consistent
- External transaction IDs need reliable storage

#### MongoDB (Document) — Flexible Data

**Products**
- Varying attributes per category:
  - Electronics: RAM, storage, screen size, processor
  - Clothing: size, color, material, fit
  - Books: author, ISBN, pages, publisher
- Relational approach would require multiple tables or sparse columns
- Document model naturally accommodates varying structures

**Reviews**
- Text-heavy data benefits from document storage
- Rating aggregations computed efficiently via pipelines
- Embedded metadata (helpful votes, verification status)
- No complex relationships requiring joins

### 5.3 Cross-Database Reference Strategy

| Reference | Implementation | Rationale |
|-----------|----------------|-----------|
| order_items → products | Store MongoDB ObjectId as VARCHAR(24) | Maintains order history even if product changes |
| reviews → users | Store PostgreSQL ID as Number | Allows user lookup for display |

**Denormalization Strategy:**
- `order_items.product_name`: Stored at order time to preserve historical accuracy
- `reviews.userName`: Cached to avoid cross-database queries on every read

---

## 6. Implementation Details

### 6.1 Backend API Endpoints

#### Users (PostgreSQL)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| GET | /api/users/:id | Get user by ID |
| POST | /api/users | Create new user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

#### Orders (PostgreSQL + MongoDB)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | List all orders with items |
| GET | /api/orders/:id | Get order by ID |
| POST | /api/orders | Create order (cross-DB transaction) |
| PUT | /api/orders/:id | Update order status |
| GET | /api/orders/user/:userId | Get orders by user |

#### Products (MongoDB)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List products with filtering |
| GET | /api/products/:id | Get product with reviews |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Soft delete product |
| GET | /api/products/analytics/top-rated | Aggregation: top rated |
| GET | /api/products/:id/rating-summary | Aggregation: rating distribution |

#### Reviews (MongoDB)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reviews | List reviews with filtering |
| GET | /api/reviews/:id | Get review by ID |
| POST | /api/reviews | Create review |
| PUT | /api/reviews/:id | Update review |
| DELETE | /api/reviews/:id | Delete review |
| POST | /api/reviews/:id/helpful | Vote review as helpful |
| GET | /api/reviews/product/:productId | Get reviews for product |

### 6.2 Cross-Database Order Creation

The order creation process demonstrates polyglot persistence coordination:

```javascript
async function createOrder(req, res) {
  const client = await db.getClient();
  
  try {
    const { userId, items } = req.body;
    
    // Begin PostgreSQL transaction
    await client.query('BEGIN');
    
    // Create order in PostgreSQL
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status) VALUES ($1, 'pending') RETURNING *`,
      [userId]
    );
    const order = orderResult.rows[0];
    
    let totalAmount = 0;
    
    // For each item, fetch from MongoDB and insert into PostgreSQL
    for (const item of items) {
      // Fetch product from MongoDB
      const product = await Product.findById(item.productId);
      
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Product not found' });
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      // Insert order item into PostgreSQL
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.productId, product.name, item.quantity, product.price]
      );
    }
    
    // Update order total
    await client.query(
      'UPDATE orders SET total_amount = $1 WHERE id = $2',
      [totalAmount, order.id]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(201).json({ ...order, total_amount: totalAmount });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to create order' });
  }
}
```

---

## 7. MongoDB Aggregation

### 7.1 Top Rated Products Aggregation

This aggregation pipeline calculates average ratings and joins with product data:

```javascript
async function getTopRatedProducts(req, res) {
  const topRated = await Review.aggregate([
    // Stage 1: Group reviews by product
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    },
    
    // Stage 2: Filter products with at least 1 review
    { $match: { reviewCount: { $gte: 1 } } },
    
    // Stage 3: Sort by rating (descending)
    { $sort: { avgRating: -1, reviewCount: -1 } },
    
    // Stage 4: Limit results
    { $limit: 5 },
    
    // Stage 5: Join with products collection
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    
    // Stage 6: Unwind the product array
    { $unwind: '$product' },
    
    // Stage 7: Filter only active products
    { $match: { 'product.isActive': true } },
    
    // Stage 8: Project final fields
    {
      $project: {
        _id: '$product._id',
        name: '$product.name',
        price: '$product.price',
        category: '$product.category',
        avgRating: 1,
        reviewCount: 1
      }
    }
  ]);
  
  res.json(topRated);
}
```

**Sample Output:**
```json
[
  {
    "_id": "69ea66daf8c72578110a57a8",
    "name": "Demo Laptop",
    "price": 899.99,
    "category": "Electronics",
    "avgRating": 5,
    "reviewCount": 1
  }
]
```

### 7.2 Rating Summary with $facet

The `$facet` operator enables multiple aggregations in a single query:

```javascript
async function getRatingSummary(req, res) {
  const { id } = req.params;
  
  const summary = await Review.aggregate([
    // Match reviews for this product
    { $match: { productId: mongoose.Types.ObjectId(id) } },
    
    // Run multiple aggregations in parallel
    {
      $facet: {
        // Facet 1: Overall statistics
        overall: [
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
              totalHelpfulVotes: { $sum: '$helpfulVotes' }
            }
          }
        ],
        
        // Facet 2: Rating distribution
        distribution: [
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: -1 } }
        ],
        
        // Facet 3: Recent reviews
        recentReviews: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              userName: 1,
              rating: 1,
              title: 1,
              comment: 1,
              createdAt: 1
            }
          }
        ]
      }
    }
  ]);
  
  res.json(summary[0]);
}
```

**Sample Output:**
```json
{
  "productId": "69ea66daf8c72578110a57a8",
  "productName": "Demo Laptop",
  "avgRating": 5,
  "totalReviews": 1,
  "totalHelpfulVotes": 0,
  "ratingDistribution": {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 1
  },
  "recentReviews": [
    {
      "_id": "69ea66e5f8c72578110a57ae",
      "userName": "Updated User",
      "rating": 5,
      "title": "Great!",
      "comment": "Excellent product",
      "createdAt": "2026-04-23T18:37:25.822Z"
    }
  ]
}
```

---

## 8. Frontend Interface

### 8.1 Technology Choices

- **React 18**: Component-based UI library
- **Vite**: Fast build tool with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side navigation

### 8.2 Page Descriptions

#### Home Page
Displays system health status showing connection status for:
- API server
- PostgreSQL database
- MongoDB database

Also provides an overview of the polyglot architecture with explanations.

#### Products Page (MongoDB)
- Lists all products from MongoDB
- Create new products with form
- Edit existing products inline
- Displays top-rated products (aggregation)
- Shows product details with reviews

#### Users Page (PostgreSQL)
- Lists all users from PostgreSQL
- Create new users with form
- Edit user information inline
- Displays creation timestamps

#### Orders Page (Cross-Database)
- Lists all orders with items
- Create new orders by selecting:
  - User (from PostgreSQL)
  - Products (from MongoDB)
- Update order status (pending → processing → shipped → delivered)
- Shows order totals and item details

### 8.3 API Client

```javascript
const API_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message);
  }
  
  return response.json();
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
```

---

## 9. Use Cases

### Use Case 1: User Registration

**Actor:** Customer  
**Database:** PostgreSQL

**Flow:**
1. Customer enters email, name, and password
2. System validates email uniqueness (UNIQUE constraint)
3. Password is hashed before storage
4. User record is created with timestamps
5. System returns user ID for future operations

**Why PostgreSQL:** Email uniqueness requires atomic constraint enforcement.

### Use Case 2: Product Catalog Browsing

**Actor:** Customer  
**Database:** MongoDB

**Flow:**
1. Customer views product listing
2. Customer filters by category or price
3. Customer searches by keyword (text search)
4. System returns matching products with flexible attributes

**Why MongoDB:** Products have varying attributes; documents accommodate this naturally.

### Use Case 3: Order Placement

**Actor:** Customer  
**Databases:** PostgreSQL + MongoDB

**Flow:**
1. Customer selects products from MongoDB catalog
2. System creates order in PostgreSQL (BEGIN TRANSACTION)
3. For each product:
   - Fetch current price from MongoDB
   - Create order_item in PostgreSQL
4. Calculate and store total amount
5. Commit transaction

**Why Both:** Order integrity requires ACID; product data requires flexibility.

### Use Case 4: Review Submission

**Actor:** Customer  
**Databases:** MongoDB + PostgreSQL (lookup)

**Flow:**
1. Customer selects product and writes review
2. System verifies user exists (PostgreSQL lookup)
3. System checks for existing review (unique index)
4. Review stored with rating, title, comment
5. Rating aggregation automatically updated

**Why MongoDB:** Reviews benefit from aggregation pipelines for analytics.

### Use Case 5: Analytics Dashboard

**Actor:** Store Administrator  
**Database:** MongoDB

**Flow:**
1. Admin requests top-rated products
2. System executes aggregation pipeline
3. Returns ranked products with average ratings
4. Admin views rating distributions via $facet

**Why MongoDB:** Aggregation pipeline efficiently computes complex analytics.

---

## 10. Testing and Validation

### 10.1 CRUD Operation Tests

All operations were tested via API calls:

| Operation | PostgreSQL | MongoDB | Result |
|-----------|------------|---------|--------|
| CREATE | User created (id: 1) | Product created | ✅ Pass |
| READ | Users listed | Products listed | ✅ Pass |
| UPDATE | Name updated | Price updated | ✅ Pass |
| DELETE | User removed | Product deactivated | ✅ Pass |

### 10.2 Cross-Database Test

Order creation successfully:
1. Created order in PostgreSQL
2. Fetched products from MongoDB
3. Calculated totals correctly
4. Maintained referential integrity

### 10.3 Aggregation Tests

| Aggregation | Operators Used | Result |
|-------------|----------------|--------|
| Top Rated | $group, $avg, $sort, $lookup | ✅ Pass |
| Rating Summary | $facet, $group, $sort, $limit | ✅ Pass |

### 10.4 Health Check

```json
{
  "ok": true,
  "postgres": true,
  "mongodb": true,
  "timestamp": "2026-04-23T18:37:14.320Z"
}
```

---

## 11. Conclusion

This project successfully demonstrates polyglot persistence in a practical e-commerce context. Key achievements include:

1. **Appropriate Data Modeling**: Transactional data in PostgreSQL, flexible data in MongoDB
2. **Full CRUD Operations**: Create, Read, Update, Delete on both databases
3. **Cross-Database Coordination**: Orders that reference both databases
4. **Advanced Aggregation**: MongoDB pipelines for analytics
5. **Modern Frontend**: React application with intuitive interface

### Lessons Learned

- **Data placement matters**: Choosing the right database for each data type improves both performance and developer experience
- **Denormalization is necessary**: Cross-database joins are expensive; strategic denormalization reduces queries
- **Aggregation is powerful**: MongoDB's aggregation pipeline handles complex analytics efficiently

### Future Enhancements

- Add user authentication with JWT tokens
- Implement shopping cart functionality
- Add payment processing integration
- Implement real-time updates with WebSockets
- Add product image upload to cloud storage

---

## Appendix

### A. Environment Setup

**Backend (.env)**
```env
PORT=5001
DATABASE_URL=postgresql://user:password@host:5432/database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ecommerce
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5001
```

### B. Running the Application

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### C. API Testing Examples

```bash
# Create user
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"demo123"}'

# Create product
curl -X POST http://localhost:5001/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999.99,"stock":10,"category":"Electronics"}'

# Get top rated products
curl http://localhost:5001/api/products/analytics/top-rated
```

### D. References

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- MongoDB Documentation: https://docs.mongodb.com/
- Mongoose ODM: https://mongoosejs.com/docs/
- React Documentation: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/docs
