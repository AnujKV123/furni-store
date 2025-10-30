"use client";

import { useState, useEffect } from "react";
import { useFurnitureList, useCategories, useMe } from "./lib/queries";
import { FurnitureCard } from "./components/FurnitureCard";
import { FurnitureCardSkeleton } from "./components/FurnitureCardSkeleton";
import { RecommendedSection } from "./components/RecommendedSection";
import { SearchAndFilter, FilterOptions } from "./components/SearchAndFilter";
import { Furniture, Category } from "./lib/types";
import { QueryErrorBoundary } from "./components/QueryErrorBoundary";
import { ErrorFallback } from "./components/ErrorFallback";
import { PageLoading } from "./components/LoadingSpinner";
import { useToast } from "./components/ui/toast";
import { getErrorMessage, isNetworkError } from "./lib/errorUtils";

export default function HomePage() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  const { addToast } = useToast();
  
  const { data: furnitureResponse, isLoading, error: furnitureError, refetch } = useFurnitureList({
    ...filters,
    page: currentPage,
    limit: 12
  });
  
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const { data: userProfile } = useMe();

  // Show toast for errors
  useEffect(() => {
    if (furnitureError && !isNetworkError(furnitureError)) {
      addToast({
        type: 'error',
        title: 'Failed to Load Furniture',
        message: getErrorMessage(furnitureError),
        duration: 5000
      });
    }
  }, [furnitureError, addToast]);

  useEffect(() => {
    if (categoriesError && !isNetworkError(categoriesError)) {
      addToast({
        type: 'warning',
        title: 'Categories Unavailable',
        message: 'Unable to load categories, but you can still browse furniture.',
        duration: 4000
      });
    }
  }, [categoriesError, addToast]);

  const furniture = furnitureResponse?.data?.items || [];
  const pagination = furnitureResponse?.data?.pagination;

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
    setCurrentPage(1);
  };

  const handleFilter = (newFilters: FilterOptions) => {
    // Handle price range conversion
    if (newFilters.priceRange) {
      const [min, max] = newFilters.priceRange.split('-');
      if (max === '+') {
        newFilters.minPrice = parseInt(min);
        delete newFilters.maxPrice;
      } else {
        newFilters.minPrice = parseInt(min);
        newFilters.maxPrice = parseInt(max);
      }
      delete newFilters.priceRange;
    }
    
    setFilters(prev => ({ ...prev, ...newFilters }));
    setSelectedCategory(newFilters.category || "");
    setCurrentPage(1);
  };

  const handleCategorySelect = (categoryName: string) => {
    const newFilters = { ...filters, category: categoryName };
    setFilters(newFilters);
    setSelectedCategory(categoryName);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSelectedCategory("");
    setCurrentPage(1);
  };

  const handleSort = (sortValue: string) => {
    const [sortBy, sortOrder] = sortValue.split('-');
    setFilters(prev => ({ 
      ...prev, 
      sortBy: sortBy === 'newest' ? 'createdAt' : sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (furnitureError && isNetworkError(furnitureError)) {
    return (
      <ErrorFallback
        title="Connection Error"
        message="Unable to connect to our furniture catalog. Please check your connection and try again."
        resetError={() => refetch()}
        showHome={false}
      />
    );
  }

  return (
    <QueryErrorBoundary>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Explore Our Furniture Collection</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover beautiful, high-quality furniture pieces for every room in your home.
          </p>
        </div>

      {/* Category Navigation */}
      {!categoriesLoading && categories && categories.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Shop by Category</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCategorySelect("")}
              className={`px-4 py-2 rounded-full border transition-colors ${
                selectedCategory === ""
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-600 hover:text-blue-600"
              }`}
            >
              All Categories
            </button>
            {categories.map((category: Category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.name)}
                className={`px-4 py-2 rounded-full border transition-colors ${
                  selectedCategory === category.name
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-600 hover:text-blue-600"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <SearchAndFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}
        onClearFilters={clearAllFilters}
        categories={categories?.map((cat: Category) => ({ 
          id: cat.name, 
          name: cat.name 
        })) || []}
        currentFilters={filters}
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <FurnitureCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : furniture.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <p className="text-gray-600 mb-4">No furniture found matching your criteria.</p>
            {(filters.search || filters.category || filters.minPrice || filters.maxPrice) && (
              <button
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters and show all furniture
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-gray-600">
                Showing {((currentPage - 1) * 12) + 1}-{Math.min(currentPage * 12, pagination?.totalCount || 0)} of {pagination?.totalCount || 0} items
              </p>
              {(filters.search || filters.category || filters.minPrice || filters.maxPrice) && (
                <p className="text-sm text-gray-500 mt-1">
                  Filtered results
                  {filters.category && ` in ${filters.category}`}
                  {filters.search && ` for "${filters.search}"`}
                </p>
              )}
            </div>
            {(filters.search || filters.category || filters.minPrice || filters.maxPrice) && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {furniture.map((item: Furniture) => (
              <FurnitureCard key={item.id} furniture={item} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(
                    pagination.totalPages - 4,
                    Math.max(1, currentPage - 2)
                  )) + i;
                  
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded-md ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

        {/* Recommendations Section */}
        <RecommendedSection 
          userId={userProfile?.data?.id}
          categoryId={selectedCategory ? categories?.find((cat: any) => cat.name === selectedCategory)?.id : undefined}
          limit={8}
          showAlgorithmInfo={true}
          enableTracking={true}
        />
      </div>
    </QueryErrorBoundary>
  );
}
