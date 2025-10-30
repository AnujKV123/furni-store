/**
 * ReviewSection Component
 * 
 * Enhanced review system with the following features:
 * - Star rating submission form with validation
 * - Paginated review display (5 reviews per page)
 * - Purchase verification (users can only review purchased items)
 * - Form validation with user feedback
 * - Success/error message display
 * - Real-time review eligibility checking
 * - Responsive pagination controls
 * 
 * Requirements fulfilled: 3.1, 3.2, 3.3
 */
"use client";

import { useState, useEffect } from "react";
import { useAddReview, useMe, useReviewsForFurniture, useCanUserReview } from "@/app/lib/queries";
import { Review } from "@/app/lib/types";
import { Star, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";

type propType = {
  reviews: Review[],
  productId: string
}

interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ValidationErrors {
  rating?: string;
  comment?: string;
}

export const ReviewSection = ({ productId, reviews: initialReviews }: propType) => {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { data: userResponse } = useMe();
  const user = userResponse?.data;
  const { mutateAsync: addReview, isPending } = useAddReview(productId);

  const reviewsPerPage = 5;

  // Fetch paginated reviews using React Query
  const { data: reviewsResponse, isLoading: reviewsLoading, refetch: refetchReviews } = useReviewsForFurniture(
    productId, 
    currentPage, 
    reviewsPerPage
  );

  // Check if user can review this product using React Query
  const { data: canReviewResponse } = useCanUserReview(user?.id, productId);
  const canReview = canReviewResponse?.data?.canReview || false;

  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (rating < 1 || rating > 5) {
      errors.rating = "Please select a rating between 1 and 5 stars";
    }

    if (!comment.trim()) {
      errors.comment = "Please write a comment about your experience";
    } else if (comment.trim().length < 10) {
      errors.comment = "Comment must be at least 10 characters long";
    } else if (comment.length > 1000) {
      errors.comment = "Comment must be less than 1000 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitReview = async () => {
    if (!user) return;

    // Clear previous messages
    setSubmitMessage(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await addReview({
        rating,
        comment: comment.trim(),
        furnitureId: parseInt(productId),
        userId: user.id
      });

      // Success feedback
      setSubmitMessage({ type: 'success', text: 'Review submitted successfully!' });
      
      // Reset form
      setComment("");
      setRating(5);
      setShowReviewForm(false);
      setValidationErrors({});
      // canReview will be updated by the query

      // Refresh reviews
      refetchReviews();
      setCurrentPage(1);

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitMessage(null), 3000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to submit review";
      setSubmitMessage({ type: 'error', text: errorMessage });
      
      // Clear error message after 5 seconds
      setTimeout(() => setSubmitMessage(null), 5000);
    }
  };

  const handlePageChange = (newPage: number) => {
    const pagination = reviewsResponse?.data?.pagination;
    if (newPage >= 1 && pagination && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const reviewsData = reviewsResponse?.data;
  const displayReviews = reviewsData?.reviews || initialReviews || [];
  const pagination = reviewsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header with Review Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Customer Reviews</h2>
          {reviewsData && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={`${
                        star <= Math.round(reviewsData.averageRating || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-1">
                  {reviewsData.averageRating ? reviewsData.averageRating.toFixed(1) : '0.0'} 
                  ({reviewsData.totalReviews} review{reviewsData.totalReviews !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
          )}
        </div>
        
        {user && canReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Submit Message */}
      {submitMessage && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          submitMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {submitMessage.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{submitMessage.text}</span>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && user && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">Write Your Review</h3>
          
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    setRating(star);
                    if (validationErrors.rating) {
                      setValidationErrors(prev => ({ ...prev, rating: undefined }));
                    }
                  }}
                  className="p-1 hover:scale-110 transition-transform"
                  type="button"
                >
                  <Star
                    size={24}
                    className={`${
                      star <= rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">({rating} star{rating !== 1 ? 's' : ''})</span>
            </div>
            {validationErrors.rating && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle size={16} />
                {validationErrors.rating}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.comment ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Share your experience with this furniture... (minimum 10 characters)"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (validationErrors.comment) {
                  setValidationErrors(prev => ({ ...prev, comment: undefined }));
                }
              }}
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <div>
                {validationErrors.comment && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle size={16} />
                    {validationErrors.comment}
                  </p>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {comment.length}/1000 characters
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={submitReview}
              disabled={isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Submitting..." : "Submit Review"}
            </button>
            <button
              onClick={() => {
                setShowReviewForm(false);
                setComment("");
                setRating(5);
                setValidationErrors({});
                setSubmitMessage(null);
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* User Status Messages */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <a href="/auth/login" className="font-medium hover:underline">
              Sign in
            </a>{" "}
            to write a review for this product.
          </p>
        </div>
      )}

      {user && canReview === false && !showReviewForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800">
            You can only review furniture items that you have purchased and haven't already reviewed.
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading reviews...</p>
          </div>
        ) : displayReviews && displayReviews.length > 0 ? (
          <>
            {displayReviews.map((review: Review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {review.user?.name || "Anonymous User"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={`${
                              star <= review.rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                  {pagination.totalCount} reviews
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            pageNum === pagination.page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
};
