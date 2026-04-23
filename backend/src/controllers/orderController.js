const db = require('../db/postgres');
const Product = require('../models/Product');

async function getAllOrders(req, res) {
  try {
    const result = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    const orders = result.rows;

    for (const order of orders) {
      const itemsResult = await db.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
}

async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const orderResult = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const itemsResult = await db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );
    order.items = itemsResult.rows;

    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
}

async function createOrder(req, res) {
  const client = await db.getClient();

  try {
    const { userId, items, shippingAddress } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ message: 'User ID and items are required' });
    }

    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, shipping_address, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [userId, shippingAddress || null]
    );
    const order = orderResult.rows[0];

    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }

      const unitPrice = product.price;
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.productId, product.name, item.quantity, unitPrice]
      );
    }

    await client.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [
      totalAmount,
      order.id,
    ]);

    await client.query('COMMIT');

    const fullOrder = await db.query(
      `SELECT o.*, u.name as user_name FROM orders o
       LEFT JOIN users u ON o.user_id = u.id WHERE o.id = $1`,
      [order.id]
    );
    const orderItems = await db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );

    res.status(201).json({
      ...fullOrder.rows[0],
      total_amount: totalAmount,
      items: orderItems.rows,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Failed to create order' });
  } finally {
    client.release();
  }
}

async function updateOrder(req, res) {
  try {
    const { id } = req.params;
    const { status, shippingAddress } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (shippingAddress !== undefined) {
      updates.push(`shipping_address = $${paramCount++}`);
      values.push(shippingAddress);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const result = await db.query(
      `UPDATE orders SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Failed to update order' });
  }
}

async function getOrdersByUser(req, res) {
  try {
    const { userId } = req.params;
    const result = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    for (const order of result.rows) {
      const itemsResult = await db.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  getOrdersByUser,
};
