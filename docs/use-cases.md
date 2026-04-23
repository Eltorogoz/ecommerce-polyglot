# E-Commerce Platform - Use Cases & Value Proposition

## Application Overview

**PolyStore** is an e-commerce platform demonstrating polyglot persistence — using PostgreSQL for transactional data and MongoDB for flexible product/review data.

## Domain Value & Usability

### Why This Application is Valuable

1. **Real-World Relevance**: E-commerce platforms are ubiquitous (Amazon, eBay, Shopify)
2. **Clear Data Separation**: Different data types have genuinely different requirements
3. **Scalability Patterns**: Demonstrates how modern applications handle diverse data needs
4. **Practical Learning**: Covers authentication, transactions, search, and analytics

### Target Users

| User Type | Needs |
|-----------|-------|
| **Customers** | Browse products, read reviews, place orders |
| **Store Admins** | Manage inventory, view analytics, process orders |
| **Analysts** | Query sales data, review trends, product performance |

---

## Use Cases

### UC1: User Registration & Authentication

**Actor**: Customer  
**Database**: PostgreSQL (users table)

**Flow**:
1. Customer enters email, name, password
2. System validates email uniqueness (SQL UNIQUE constraint)
3. Password is hashed and stored
4. User receives confirmation

**Why PostgreSQL?**
- Email uniqueness must be enforced atomically
- Password security requires consistent storage
- User data rarely changes schema

**API**: `POST /api/users`

---

### UC2: Browse Products with Flexible Attributes

**Actor**: Customer  
**Database**: MongoDB (products collection)

**Flow**:
1. Customer views product catalog
2. Filters by category, price range
3. Searches by keywords
4. Views product details with varying attributes

**Why MongoDB?**
- Electronics have: RAM, storage, screen size
- Clothing has: size, color, material
- Books have: author, ISBN, pages
- Relational tables would require: products_electronics, products_clothing, etc.

**API**: `GET /api/products?category=Electronics&minPrice=100&sort=price_asc`

**Example Product Documents**:
```javascript
// Electronics product
{
  name: "MacBook Pro 16",
  category: "Electronics",
  price: 2499,
  attributes: {
    ram: "32GB",
    storage: "1TB SSD",
    processor: "M3 Max",
    screenSize: "16.2 inches"
  }
}

// Clothing product
{
  name: "Cotton T-Shirt",
  category: "Clothing", 
  price: 29.99,
  attributes: {
    size: ["S", "M", "L", "XL"],
    color: "Navy Blue",
    material: "100% Cotton"
  }
}
```

---

### UC3: Place an Order (Cross-Database Transaction)

**Actor**: Customer  
**Databases**: PostgreSQL (orders, order_items) + MongoDB (products)

**Flow**:
1. Customer adds products to cart
2. Submits order with shipping address
3. System creates order in PostgreSQL (BEGIN TRANSACTION)
4. For each item:
   - Fetches product from MongoDB
   - Creates order_item with product_id (MongoDB ObjectId as string)
   - Denormalizes product name and price
5. Calculates total and commits transaction

**Why This Split?**
- Order integrity requires ACID (what if payment fails mid-order?)
- Product data is read from MongoDB for flexibility
- Product name/price denormalized to preserve historical accuracy

**API**: `POST /api/orders`
```json
{
  "userId": 1,
  "items": [
    { "productId": "507f1f77bcf86cd799439011", "quantity": 2 },
    { "productId": "507f1f77bcf86cd799439012", "quantity": 1 }
  ],
  "shippingAddress": "123 Main St, City, 12345"
}
```

---

### UC4: Write a Product Review

**Actor**: Customer  
**Databases**: MongoDB (reviews) + PostgreSQL (users lookup)

**Flow**:
1. Customer selects product and writes review
2. System verifies user exists (PostgreSQL lookup)
3. Checks if user already reviewed this product (unique index)
4. Stores review with userId (integer) and userName (denormalized)
5. Review immediately affects product ratings

**Why MongoDB?**
- Reviews are text-heavy, benefit from text search
- Rating aggregations computed efficiently
- One user can review many products (flexible querying)

**API**: `POST /api/reviews`
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "userId": 1,
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Fast shipping, great quality. Highly recommend."
}
```

---

### UC5: View Product Analytics (Aggregation)

**Actor**: Store Admin  
**Database**: MongoDB (reviews + products via $lookup)

**Flow**:
1. Admin requests top-rated products
2. System runs aggregation pipeline:
   - Groups reviews by productId
   - Calculates average rating and count
   - Joins with products collection
   - Sorts by rating descending
3. Returns ranked product list

**Why MongoDB Aggregation?**
- Complex analytics in single query
- No N+1 query problem
- Built-in operators: $avg, $group, $lookup, $facet

**API**: `GET /api/products/analytics/top-rated`

**Aggregation Pipeline**:
```javascript
[
  { $group: { _id: "$productId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  { $sort: { avgRating: -1 } },
  { $limit: 5 },
  { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
  { $unwind: "$product" },
  { $project: { name: "$product.name", avgRating: 1, reviewCount: "$count" } }
]
```

---

### UC6: View Rating Distribution ($facet)

**Actor**: Customer / Admin  
**Database**: MongoDB

**Flow**:
1. User views product detail page
2. System fetches rating summary using $facet
3. Returns in single query:
   - Overall stats (avg rating, total reviews)
   - Rating distribution (5★: 45, 4★: 30, ...)
   - Recent reviews (last 5)

**Why $facet?**
- Multiple aggregations in one database round-trip
- Efficient for dashboard-style views
- Demonstrates advanced MongoDB capability

**API**: `GET /api/products/:id/rating-summary`

**Response**:
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "productName": "MacBook Pro 16",
  "avgRating": 4.7,
  "totalReviews": 156,
  "ratingDistribution": {
    "5": 98,
    "4": 35,
    "3": 15,
    "2": 5,
    "1": 3
  },
  "recentReviews": [...]
}
```

---

### UC7: Update Order Status

**Actor**: Store Admin  
**Database**: PostgreSQL

**Flow**:
1. Admin views pending orders
2. Updates status: pending → processing → shipped → delivered
3. System updates order with timestamp

**Why PostgreSQL?**
- Status transitions need consistency
- Audit trail of updates (updated_at trigger)
- May trigger payment processing or refunds

**API**: `PUT /api/orders/:id`
```json
{ "status": "shipped" }
```

---

## Data Flow Diagram

```
                                    ┌─────────────────┐
                                    │   React UI      │
                                    │   (Frontend)    │
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  Express API    │
                                    │   (Backend)     │
                                    └────────┬────────┘
                           ┌─────────────────┼─────────────────┐
                           │                 │                 │
                           ▼                 │                 ▼
              ┌────────────────────┐         │    ┌────────────────────┐
              │    PostgreSQL      │         │    │     MongoDB        │
              │    (Supabase)      │         │    │     (Atlas)        │
              ├────────────────────┤         │    ├────────────────────┤
              │ • users            │◄────────┼───►│ • products         │
              │ • orders           │  cross- │    │ • reviews          │
              │ • order_items      │   ref   │    │                    │
              │ • payments         │         │    │                    │
              └────────────────────┘         │    └────────────────────┘
                                             │
                        ACID Transactions    │    Flexible Schema
                        Referential Integrity│    Aggregation Pipeline
                        Financial Data       │    Text Search
```

---

## Summary: Polyglot Persistence Benefits

| Aspect | PostgreSQL | MongoDB |
|--------|------------|---------|
| **Data Type** | Users, Orders, Payments | Products, Reviews |
| **Schema** | Fixed, normalized | Flexible, denormalized |
| **Consistency** | Strong (ACID) | Eventual (configurable) |
| **Relationships** | Foreign keys | References + embedding |
| **Queries** | Complex JOINs | Aggregation pipelines |
| **Use Case** | Transactions, audit | Catalog, analytics |

This architecture reflects real-world e-commerce patterns used by companies like Amazon (DynamoDB + Aurora), eBay (MongoDB + MySQL), and others.
