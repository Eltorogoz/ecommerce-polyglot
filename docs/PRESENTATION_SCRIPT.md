# Presentation Script
## E-Commerce Polyglot Persistence Platform
### Duration: 15 minutes + Q&A

---

## SLIDE 1: Title (30 seconds)

> "Good [morning/afternoon], my name is Kris Valladares. Today I'm presenting my database project: an E-Commerce Platform built with Polyglot Persistence.
>
> This project uses two different databases—PostgreSQL and MongoDB—working together in one application. I'll explain why this makes sense and show you a live demo."

---

## SLIDE 2: What is Polyglot Persistence? (1 minute)

> "So what is polyglot persistence? It's a design approach where we use multiple database technologies in one application, choosing the best database for each type of data.
>
> My application is an online e-commerce store. Instead of forcing all data into one database, I split it:
> - PostgreSQL on Supabase handles users, orders, and payments
> - MongoDB Atlas handles products and reviews
>
> Each database is optimized for what it does best."

---

## SLIDE 3: Why Two Databases? (1.5 minutes)

> "You might ask—why not just use one database?
>
> Different data has different needs.
>
> For users and payments, I need ACID transactions. If a payment fails halfway through, I need the whole thing to roll back. PostgreSQL is built for this.
>
> But for products, I have a problem. An electronics product has RAM, storage, and processor specs. A clothing item has size, color, and material. A book has author and ISBN.
>
> In a SQL table, I'd need either hundreds of mostly-empty columns, or separate tables for each product type. Neither is efficient.
>
> MongoDB's flexible document model solves this. Each product stores exactly the attributes it needs."

---

## SLIDE 4: Architecture (1.5 minutes)

> "Here's my system architecture.
>
> At the top is a React frontend on port 3000. Users interact with this to browse products, manage their accounts, and place orders.
>
> The frontend talks to my Node.js Express backend on port 5001. This handles all API requests.
>
> The backend connects to two databases:
> - PostgreSQL through Supabase stores users, orders, order items, and payments—300 users, 300 orders in my demo
> - MongoDB Atlas stores products and reviews—100 products from a real Kaggle dataset
>
> When someone places an order, the backend talks to both databases: it looks up the product price in MongoDB, then creates the order in PostgreSQL."

---

## SLIDE 5: ER Diagram - PostgreSQL (1.5 minutes)

> "Here's my PostgreSQL schema with four tables.
>
> The users table has email with a unique constraint, plus password hash and name.
>
> Orders link to users through a foreign key. Each order has a status—pending, processing, shipped, or delivered—and a total amount.
>
> Order items is interesting. The product_id column stores a MongoDB ObjectId as a string. This is my cross-database reference. I also store product_name and unit_price directly—this is intentional denormalization so if a product price changes later, the order still shows what the customer actually paid.
>
> Payments tracks transactions for each order with payment method and status."

---

## SLIDE 6: MongoDB Schema (1 minute)

> "On the MongoDB side, I have two collections.
>
> The products collection stores each product as a document. Notice the category field can be anything—Health Beauty, Electronics, Sports. And the attributes field is a flexible map for any extra data.
>
> The reviews collection references both databases:
> - productId is a MongoDB ObjectId pointing to a product
> - userId is an integer referencing a PostgreSQL user
>
> I also store userName directly in the review to avoid cross-database lookups when displaying reviews."

---

## SLIDE 7: The Dataset (1 minute)

> "For realistic data, I used the Brazilian E-Commerce Dataset from Kaggle.
>
> This is real data from Olist, an actual Brazilian marketplace:
> - 99,000 orders
> - 32,000 products
> - 112,000 order items
>
> I wrote a transformation script that converts this data into my schema format—mapping their customer IDs to my user IDs, generating proper names and emails, and creating the CSV and JSON files for import.
>
> My demo has 300 users, 300 orders, and 100 products from this real dataset."

---

## SLIDE 8: MongoDB Aggregation (1.5 minutes)

> "One requirement was implementing MongoDB aggregation. I built two aggregation pipelines.
>
> First is Top Rated Products. This uses:
> - $group to calculate average rating per product
> - $sort to rank by rating
> - $lookup to join with the products collection and get product details
>
> All in one database query.
>
> Second is Rating Summary using $facet. Facet lets me run multiple aggregations in parallel. In one query I get:
> - Overall average rating and total reviews
> - Rating distribution—how many 5-star, 4-star, etc.
> - The 5 most recent reviews
>
> Without aggregation, this would take three separate queries plus application code. With $facet, the database does everything."

---

## SLIDE 9: Technical Challenges (1.5 minutes)

> "I faced several challenges.
>
> First: cross-database references. How do I link MongoDB products to PostgreSQL orders? My solution was storing MongoDB ObjectId as a VARCHAR(24) string in PostgreSQL.
>
> Second: data consistency. If a product price changes after an order, what happens? I solved this with denormalization—I copy the product name and price into order_items at order time.
>
> Third: MongoDB authentication. I kept getting 'authentication failed' errors. Turned out my password had special characters that needed URL encoding. I solved it by creating a new database user with a simple alphanumeric password."

---

## SLIDE 10: Demo (3 minutes)

> "Let me show you the application."

**[Open http://localhost:3000]**

> "This is the home page. You can see the health check—all three indicators are green, showing both PostgreSQL and MongoDB are connected."

**[Click Products]**

> "Here are the products from MongoDB. You can see different categories—Health Beauty, Electronics, Sports. Let me create a new product..."
>
> *[Add a product with name, price, category]*
>
> "It's saved to MongoDB."

**[Click Users]**

> "These are the 300 users from PostgreSQL, imported from the Kaggle dataset."

**[Click Orders]**

> "Here are the orders. Watch what happens when I create a new one..."
>
> *[Select a user, add a product, create order]*
>
> "The backend fetched the product from MongoDB, calculated the total, and created the order in PostgreSQL. That's polyglot persistence in action."

---

## SLIDE 11: Rubric Coverage (1 minute)

> "Let me summarize how my project meets all requirements:
>
> - MongoDB with collections: products and reviews ✓
> - Correct MongoDB data model with types, indexes, references ✓
> - PostgreSQL with ER diagram and foreign keys ✓
> - Good data model rationale—ACID for transactions, flexible for products ✓
> - React frontend implementation ✓
> - Full CRUD on both databases ✓
> - MongoDB aggregation using $group, $facet, $lookup ✓
>
> The code is on GitHub at github.com/Eltorogoz/ecommerce-polyglot."

---

## SLIDE 12: Conclusion (30 seconds)

> "In conclusion, this project demonstrates that different data needs different databases.
>
> PostgreSQL handles our financial transactions with ACID guarantees.
> MongoDB handles our flexible product data with powerful aggregations.
> Together, they create a more robust system than either could alone.
>
> Thank you. I'm happy to answer any questions."

---

## Q&A Preparation

**Q: Why not use MongoDB for everything?**
> "MongoDB now supports transactions, but PostgreSQL is still stronger for financial data. It has decades of reliability for ACID compliance, and its constraint system is more mature. For real money, I want the strongest guarantees."

**Q: How do you handle if one database goes down?**
> "The health endpoint checks both databases. If MongoDB is down, users can still log in and view order history—that's in PostgreSQL. They just can't browse products until MongoDB recovers."

**Q: What about data synchronization?**
> "Since I use references, not duplication, there's no sync needed. The product_id in PostgreSQL just points to MongoDB. The only denormalized data is intentional—product name and price in order_items are historical snapshots."

**Q: Why Supabase instead of regular PostgreSQL?**
> "For a university project, Supabase was practical—free tier, nice dashboard, managed infrastructure. The PostgreSQL underneath is standard. I could migrate by changing one connection string."

**Q: How does aggregation improve performance?**
> "Without aggregation, I'd need multiple queries and combine them in code. Aggregation does everything in one database round-trip. The $facet example computes three different results simultaneously."

---

## Pre-Presentation Checklist

- [ ] Backend running: `cd backend && npm run dev`
- [ ] Frontend running: `cd frontend && npm run dev`
- [ ] Browser open to http://localhost:3000
- [ ] Test all pages load correctly
- [ ] Have terminal ready to show API calls if needed

## Timing Summary

| Section | Time |
|---------|------|
| Title + Overview | 2.5 min |
| Why + Architecture | 3 min |
| Database Schemas | 2.5 min |
| Dataset + Aggregation | 2.5 min |
| Challenges | 1.5 min |
| **Live Demo** | 3 min |
| Rubric + Conclusion | 1.5 min |
| **Total** | ~15 min |
