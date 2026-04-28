import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, endpoints } from '../api/client';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    try {
      const [productData, summaryData, usersData] = await Promise.all([
        api.get(`${endpoints.products}/${id}`),
        api.get(`${endpoints.products}/${id}/rating-summary`).catch(() => null),
        api.get(endpoints.users).catch(() => []),
      ]);
      setProduct(productData);
      setSummary(summaryData);
      setUsers(usersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading product...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!product) return <p className="text-gray-500">Product not found.</p>;

  const avg = product.avgRating || 0;
  const total = product.totalReviews || 0;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/products" className="text-primary-600 hover:underline text-sm">
          ← Back to products
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-500 mt-1">{product.category || 'Uncategorized'}</p>
          </div>
          <span className="text-3xl font-bold text-primary-600">
            ${product.price?.toFixed(2)}
          </span>
        </div>

        {product.description && (
          <p className="text-gray-700 mt-4">{product.description}</p>
        )}

        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <span>Stock: <strong>{product.stock}</strong></span>
          <div className="flex items-center gap-2">
            <StarDisplay rating={avg} />
            <span className="font-medium text-gray-900">{avg.toFixed(1)}</span>
            <span className="text-gray-500">({total} review{total === 1 ? '' : 's'})</span>
          </div>
        </div>
      </div>

      {summary && total > 0 && (
        <RatingDistribution summary={summary} />
      )}

      <ReviewForm
        productId={id}
        users={users}
        existingReviews={product.reviews || []}
        onCreated={refresh}
      />

      <ReviewsList reviews={product.reviews || []} onChanged={refresh} />
    </div>
  );
}

function StarDisplay({ rating, size = 'text-lg' }) {
  const rounded = Math.round(rating);
  return (
    <span className={`${size} tracking-tight`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? 'text-yellow-500' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className={`text-3xl transition-colors ${
            n <= display ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-300'
          }`}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
        >
          ★
        </button>
      ))}
      <span className="ml-3 text-sm text-gray-600">
        {value ? `${value} / 5` : 'Select a rating'}
      </span>
    </div>
  );
}

function RatingDistribution({ summary }) {
  const { ratingDistribution, totalReviews } = summary;
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating breakdown</h2>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution?.[star] || 0;
          const pct = totalReviews ? (count / totalReviews) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-3 text-sm">
              <span className="w-12 text-gray-700">{star} star</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-yellow-500 h-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-gray-500">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewForm({ productId, users, existingReviews, onCreated }) {
  const [userId, setUserId] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const reviewedUserIds = new Set(existingReviews.map((r) => String(r.userId)));
  const alreadyReviewed = userId && reviewedUserIds.has(String(userId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!userId) return setError('Please pick a reviewer.');
    if (!rating) return setError('Please choose a star rating.');

    setSubmitting(true);
    try {
      await api.post(endpoints.reviews, {
        productId,
        userId: parseInt(userId, 10),
        rating,
        title: title || undefined,
        comment: comment || undefined,
      });
      setUserId('');
      setRating(0);
      setTitle('');
      setComment('');
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Leave a review</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border rounded-md px-3 py-2 w-full md:w-1/2"
          required
        >
          <option value="">Select a user...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
        {users.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            No users yet — create one in the{' '}
            <Link to="/users" className="underline">Users tab</Link> first.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Sums up your experience"
          className="border rounded-md px-3 py-2 w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          placeholder="What did you like or dislike?"
          className="border rounded-md px-3 py-2 w-full"
        />
      </div>

      {alreadyReviewed && (
        <p className="text-sm text-amber-600">
          This user has already reviewed the product. Submitting will fail — pick a different user
          or edit/delete the existing review below.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}

function ReviewsList({ reviews, onChanged }) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
        <p className="text-gray-500 mt-2">No reviews yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Reviews ({reviews.length})
      </h2>
      <div className="divide-y">
        {reviews.map((review) => (
          <ReviewItem key={review._id} review={review} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}

function ReviewItem({ review, onChanged }) {
  const [helpful, setHelpful] = useState(review.helpfulVotes || 0);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleHelpful = async () => {
    setVoting(true);
    try {
      const res = await api.post(`${endpoints.reviews}/${review._id}/helpful`);
      setHelpful(res.helpfulVotes);
    } catch (err) {
      alert(err.message);
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this review?')) return;
    setDeleting(true);
    try {
      await api.delete(`${endpoints.reviews}/${review._id}`);
      onChanged();
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <StarDisplay rating={review.rating} size="text-base" />
            <span className="font-medium text-gray-900">{review.userName || 'Anonymous'}</span>
          </div>
          {review.title && (
            <p className="font-semibold text-gray-900 mt-1">{review.title}</p>
          )}
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      {review.comment && (
        <p className="text-gray-700 mt-2 whitespace-pre-wrap">{review.comment}</p>
      )}
      <div className="mt-3 flex items-center gap-4 text-sm">
        <button
          onClick={handleHelpful}
          disabled={voting}
          className="text-gray-600 hover:text-primary-600 disabled:opacity-50"
        >
          👍 Helpful ({helpful})
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
