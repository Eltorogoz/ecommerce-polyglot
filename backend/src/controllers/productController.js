const Product = require('../models/Product');
const Review = require('../models/Review');

async function getAllProducts(req, res) {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    let query = Product.find(filter);

    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else if (sort === 'newest') query = query.sort({ createdAt: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query.lean();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviews = await Review.find({ productId: String(id) })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const stats = await Review.aggregate([
      { $match: { productId: String(product._id) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    res.json({
      ...product,
      reviews,
      avgRating: stats[0]?.avgRating || 0,
      totalReviews: stats[0]?.totalReviews || 0,
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
}

async function createProduct(req, res) {
  try {
    const { name, description, price, category, stock, images, attributes, tags } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Name, price, and stock are required' });
    }

    const count = await Product.countDocuments();
    const newId = `prod_${String(count + 1).padStart(6, '0')}`;

    const product = new Product({
      _id: newId,
      name,
      description,
      price,
      category,
      stock,
      images,
      attributes,
      tags,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to update product' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deactivated', id: product._id });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
}

async function getTopRatedProducts(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topRated = await Review.aggregate([
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
      { $match: { reviewCount: { $gte: 1 } } },
      { $sort: { avgRating: -1, reviewCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { 'product.isActive': true } },
      {
        $project: {
          _id: '$product._id',
          name: '$product.name',
          price: '$product.price',
          category: '$product.category',
          avgRating: 1,
          reviewCount: 1,
        },
      },
    ]);

    res.json(topRated);
  } catch (err) {
    console.error('Error fetching top rated products:', err);
    res.status(500).json({ message: 'Failed to fetch top rated products' });
  }
}

async function getRatingSummary(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const summary = await Review.aggregate([
      { $match: { productId: String(product._id) } },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                totalHelpfulVotes: { $sum: '$helpfulVotes' },
              },
            },
          ],
          distribution: [
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: -1 } },
          ],
          recentReviews: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                userName: 1,
                rating: 1,
                title: 1,
                comment: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    const { overall, distribution, recentReviews } = summary[0];

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      ratingDistribution[d._id] = d.count;
    });

    res.json({
      productId: id,
      productName: product.name,
      avgRating: overall[0]?.avgRating || 0,
      totalReviews: overall[0]?.totalReviews || 0,
      totalHelpfulVotes: overall[0]?.totalHelpfulVotes || 0,
      ratingDistribution,
      recentReviews,
    });
  } catch (err) {
    console.error('Error fetching rating summary:', err);
    res.status(500).json({ message: 'Failed to fetch rating summary' });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopRatedProducts,
  getRatingSummary,
};
