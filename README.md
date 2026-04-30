# E-Commerce Platform with Polyglot Persistence

A full-stack e-commerce application demonstrating **polyglot persistence** — using PostgreSQL for transactional data and MongoDB for flexible product/review data.

## Live Demo

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Tailwind)                 │
│                        localhost:3000                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)                   │
│                        localhost:5001                           │
└─────────────────────────────────────────────────────────────────┘
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

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| SQL Database | PostgreSQL (Supabase) |
| NoSQL Database | MongoDB Atlas |

## Why Polyglot Persistence?

| Data Type | Database | Reasoning |
|-----------|----------|-----------|
| **Users** | PostgreSQL | Unique email constraints, password security |
| **Orders** | PostgreSQL | ACID transactions for financial data |
| **Payments** | PostgreSQL | Audit requirements, referential integrity |
| **Products** | MongoDB | Flexible attributes per category |
| **Reviews** | MongoDB | Text-heavy, aggregation pipelines |

## Features

- ✅ Full CRUD operations on both databases
- ✅ Cross-database order creation (PostgreSQL + MongoDB)
- ✅ MongoDB Aggregation: Top-rated products, Rating summaries
- ✅ Modern React UI with Tailwind CSS
- ✅ Real Kaggle dataset integration (Brazilian E-Commerce)

## Project Structure

```
ecommerce-polyglot/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── db/              # Database connections + SQL schema
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API endpoints
│   │   └── index.js         # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── pages/           # React pages
│   │   └── App.jsx          # Main app component
│   └── package.json
├── data/                    # Data transformation scripts
│   ├── transform-olist.js   # Kaggle data transformer
│   └── import-to-mongodb.js # MongoDB import helper
├── docs/
│   ├── PROJECT_REPORT.md    # Full project report
│   ├── PRESENTATION_SCRIPT.md
│   └── er-diagram.md        # Database diagrams
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier)
- MongoDB Atlas account (free tier)

### 1. Clone & Install

```bash
git clone https://github.com/Eltorogoz/ecommerce-polyglot.git
cd ecommerce-polyglot

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure Environment

Create `backend/.env`:

```env
PORT=5001
DATABASE_URL=postgresql://user:password@db.xxx.supabase.co:5432/postgres
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ecommerce
```

### 3. Initialize PostgreSQL Schema

Run in Supabase SQL Editor:

```sql
-- See backend/src/db/schema.sql for full schema
```

### 4. Start Servers

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### 5. Open Application

Visit http://localhost:3000

## API Endpoints

### Health Check
```
GET /api/health → { ok, postgres, mongodb }
```

### Users (PostgreSQL)
```
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

### Orders (PostgreSQL)
```
GET    /api/orders
POST   /api/orders      # Cross-DB: fetches products from MongoDB
PUT    /api/orders/:id
```

### Products (MongoDB)
```
GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/products/analytics/top-rated
GET    /api/products/:id/rating-summary
```

### Reviews (MongoDB)
```
GET    /api/reviews
POST   /api/reviews
PUT    /api/reviews/:id
DELETE /api/reviews/:id
```

## MongoDB Aggregation Examples

### Top Rated Products
```javascript
db.reviews.aggregate([
  { $group: { _id: "$productId", avgRating: { $avg: "$rating" } } },
  { $sort: { avgRating: -1 } },
  { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } }
])
```

### Rating Distribution ($facet)
```javascript
db.reviews.aggregate([
  { $match: { productId: ObjectId("...") } },
  { $facet: {
      overall: [{ $group: { _id: null, avgRating: { $avg: "$rating" } } }],
      distribution: [{ $group: { _id: "$rating", count: { $sum: 1 } } }],
      recent: [{ $sort: { createdAt: -1 } }, { $limit: 5 }]
  }}
])
```

## Dataset

This project uses the [Brazilian E-Commerce Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) from Kaggle:
- 99,441 orders
- 32,951 products
- 112,650 order items
- Customer reviews with ratings

## Documentation

- [Full Project Report](docs/PROJECT_REPORT.md)
- [Presentation Script](docs/PRESENTATION_SCRIPT.md)
- [ER Diagram & Schema](docs/er-diagram.md)

## License

MIT - University project for educational purposes.
