const Review = require('../models/Review');
const Product = require('../models/Product');
const db = require('../db/postgres');

async function getAllReviews(req, res) {
  try {
    const { productId, userId, minRating } = req.query;
    const filter = {};

    if (productId) filter.productId = productId;
    if (userId) filter.userId = parseInt(userId);
    if (minRating) filter.rating = { $gte: parseInt(minRating) };

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .populate('productId', 'name price')
      .lean();

    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
}

async function getReviewById(req, res) {
  try {
    const { id } = req.params;
    const review = await Review.findById(id)
      .populate('productId', 'name price')
      .lean();

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json(review);
  } catch (err) {
    console.error('Error fetching review:', err);
    res.status(500).json({ message: 'Failed to fetch review' });
  }
}

async function createReview(req, res) {
  try {
    const { productId, userId, rating, title, comment } = req.body;

    if (!productId || !userId || !rating) {
      return res.status(400).json({ message: 'Product ID, user ID, and rating are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let userName = 'Anonymous';
    try {
      const userResult = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length > 0) {
        userName = userResult.rows[0].name;
      }
    } catch (err) {
      console.warn('Could not fetch user name from PostgreSQL:', err.message);
    }

    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(409).json({ message: 'User has already reviewed this product' });
    }

    const review = new Review({
      productId,
      userId,
      userName,
      rating,
      title,
      comment,
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error('Error creating review:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'User has already reviewed this product' });
    }
    res.status(500).json({ message: 'Failed to create review' });
  }
}

async function updateReview(req, res) {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const updates = {};
    if (rating !== undefined) updates.rating = rating;
    if (title !== undefined) updates.title = title;
    if (comment !== undefined) updates.comment = comment;

    const review = await Review.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (err) {
    console.error('Error updating review:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to update review' });
  }
}

async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted', id: review._id });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: 'Failed to delete review' });
  }
}

async function voteHelpful(req, res) {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(
      id,
      { $inc: { helpfulVotes: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ helpfulVotes: review.helpfulVotes });
  } catch (err) {
    console.error('Error voting helpful:', err);
    res.status(500).json({ message: 'Failed to vote' });
  }
}

async function getReviewsByProduct(req, res) {
  try {
    const { productId } = req.params;
    const { sort } = req.query;

    let sortOption = { createdAt: -1 };
    if (sort === 'rating_high') sortOption = { rating: -1 };
    if (sort === 'rating_low') sortOption = { rating: 1 };
    if (sort === 'helpful') sortOption = { helpfulVotes: -1 };

    const reviews = await Review.find({ productId })
      .sort(sortOption)
      .lean();

    res.json(reviews);
  } catch (err) {
    console.error('Error fetching product reviews:', err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
}

module.exports = {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  voteHelpful,
  getReviewsByProduct,
};
