# E-Commerce Platform - Database Design Documentation

## ER Diagram (PostgreSQL)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RELATIONAL DATABASE (PostgreSQL)                   │
└─────────────────────────────────────────────────────────────────────────────┘

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
    │   amount             │      │   product_id ────────┼────┼───► MongoDB
    │   payment_method     │      │   product_name       │    │    (denormalized)
    │   status             │      │   quantity           │    │
    │   transaction_id     │      │   unit_price         │    │
    │   created_at         │      │   created_at         │    │
    │   updated_at         │      └──────────────────────┘    │
    └──────────────────────┘                                  │
                                                              │
                                                              │
┌─────────────────────────────────────────────────────────────┼───────────────┐
│                        NON-RELATIONAL DATABASE (MongoDB)    │               │
└─────────────────────────────────────────────────────────────┼───────────────┘
                                                              │
    ┌──────────────────────────┐      ┌──────────────────────┼────────┐
    │       PRODUCTS           │      │       REVIEWS        │        │
    ├──────────────────────────┤      ├──────────────────────┼────────┤
    │ * _id (ObjectId)         │◄─────│   productId (ref) ───┘        │
    │   name                   │      │ * _id (ObjectId)              │
    │   description            │      │   userId ─────────────────────┘
    │   price                  │      │   userName (denormalized)     
    │   category               │      │   rating (1-5)                
    │   stock                  │      │   title                       
    │   images [ ]             │      │   comment                     
    │   attributes { Map }     │      │   helpfulVotes                
    │   tags [ ]               │      │   isVerifiedPurchase          
    │   isActive               │      │   createdAt                   
    │   createdAt              │      │   updatedAt                   
    │   updatedAt              │      └───────────────────────────────┘
    └──────────────────────────┘

    Legend:
    ─────────────────────────────
    * = Primary Key
    (PK) = Primary Key
    (FK) = Foreign Key
    [ ] = Array field
    { } = Embedded document/Map
    ──► = Cross-database reference
```

## Relationships Summary

### PostgreSQL (Relational)
| Relationship | Type | Description |
|--------------|------|-------------|
| Users → Orders | 1:N | One user can have many orders |
| Orders → Order_Items | 1:N | One order contains many line items |
| Orders → Payments | 1:N | One order can have multiple payment attempts |

### Cross-Database References
| From | To | Strategy |
|------|-----|----------|
| order_items.product_id | products._id | Store MongoDB ObjectId as VARCHAR(24) |
| reviews.userId | users.id | Store PostgreSQL integer ID in MongoDB |

### MongoDB (Document)
| Relationship | Type | Description |
|--------------|------|-------------|
| Products ↔ Reviews | 1:N | One product has many reviews (via productId reference) |

## Data Model Rationale

### Why PostgreSQL for Users, Orders, Payments?

1. **ACID Compliance**: Financial transactions require atomicity (all-or-nothing)
2. **Referential Integrity**: Foreign keys ensure data consistency
3. **Strong Typing**: Currency amounts need DECIMAL precision
4. **Audit Requirements**: Payment records need strict consistency
5. **Complex Joins**: Order history queries join users, orders, items efficiently

### Why MongoDB for Products, Reviews?

1. **Flexible Schema**: Products have varying attributes (electronics vs clothing)
2. **Nested Data**: Images array, attributes map don't fit relational model well
3. **Text Search**: Built-in text indexes for product search
4. **Aggregation**: Rating summaries, top products computed efficiently
5. **Denormalization**: Reviews store userName to avoid cross-DB joins

## Table Specifications

### PostgreSQL Tables

#### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

#### orders
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INTEGER | FK → users(id), NOT NULL |
| status | VARCHAR(50) | CHECK (pending, processing, shipped, delivered, cancelled) |
| total_amount | DECIMAL(10,2) | DEFAULT 0.00 |
| shipping_address | TEXT | - |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

#### order_items
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| order_id | INTEGER | FK → orders(id), NOT NULL |
| product_id | VARCHAR(24) | NOT NULL (MongoDB ObjectId) |
| product_name | VARCHAR(255) | Denormalized |
| quantity | INTEGER | CHECK (> 0), NOT NULL |
| unit_price | DECIMAL(10,2) | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

#### payments
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| order_id | INTEGER | FK → orders(id), NOT NULL |
| amount | DECIMAL(10,2) | NOT NULL |
| payment_method | VARCHAR(50) | CHECK (credit_card, debit_card, paypal, bank_transfer) |
| status | VARCHAR(50) | CHECK (pending, completed, failed, refunded) |
| transaction_id | VARCHAR(255) | External reference |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### MongoDB Collections

#### products
```javascript
{
  _id: ObjectId,
  name: String (required, max 255),
  description: String,
  price: Number (required, min 0),
  category: String (default: "Uncategorized"),
  stock: Number (required, min 0),
  images: [{ url: String, alt: String }],
  attributes: Map<String, Mixed>,  // Flexible key-value pairs
  tags: [String],
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- { name: "text", description: "text" }  // Full-text search
- { category: 1 }
- { price: 1 }
- { isActive: 1 }
```

#### reviews
```javascript
{
  _id: ObjectId,
  productId: ObjectId (ref: products, required),
  userId: Number (required),  // References PostgreSQL users.id
  userName: String,           // Denormalized from PostgreSQL
  rating: Number (required, 1-5),
  title: String (max 255),
  comment: String (max 2000),
  helpfulVotes: Number (default: 0),
  isVerifiedPurchase: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- { productId: 1 }
- { userId: 1 }
- { rating: -1 }
- { createdAt: -1 }
- { productId: 1, userId: 1 } (unique)  // One review per user per product
```

## MongoDB Aggregation Examples

### 1. Top Rated Products
```javascript
db.reviews.aggregate([
  { $group: {
      _id: "$productId",
      avgRating: { $avg: "$rating" },
      reviewCount: { $sum: 1 }
  }},
  { $match: { reviewCount: { $gte: 1 } } },
  { $sort: { avgRating: -1, reviewCount: -1 } },
  { $limit: 5 },
  { $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "_id",
      as: "product"
  }},
  { $unwind: "$product" },
  { $project: {
      name: "$product.name",
      price: "$product.price",
      avgRating: 1,
      reviewCount: 1
  }}
])
```

### 2. Rating Distribution with $facet
```javascript
db.reviews.aggregate([
  { $match: { productId: ObjectId("...") } },
  { $facet: {
      overall: [
        { $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 }
        }}
      ],
      distribution: [
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ],
      recentReviews: [
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        { $project: { userName: 1, rating: 1, title: 1, comment: 1 } }
      ]
  }}
])
```
