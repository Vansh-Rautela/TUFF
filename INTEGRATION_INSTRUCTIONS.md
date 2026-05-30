// Add this after line 33 in PersonalizedHomepage.tsx
// Replace the selectedFilters state with these:

const [showBrandFilter, setShowBrandFilter] = useState(false);
const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

// Update the loadRecommendedProducts function around line 83:
// Change this line:
//    brands: selectedFilters.brands.length > 0 ? selectedFilters.brands : undefined
// To:
//    brands: selectedBrands.length > 0 ? selectedBrands : undefined

// Update the Filter button around line 215:
// Replace the current Filter button with:
<button
    onClick={() => setShowBrandFilter(true)}
    className="p-3 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors relative"
    title="Filter by brands"
>
    <Filter size={20} />
    {selectedBrands.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {selectedBrands.length}
        </span>
    )}
</button>

// Add these components before the closing </div> at the end:
{/* Loading Screen */}
{isLoading && (
    <LoadingScreen 
        message="Finding Your Perfect Style..."
        submessage="Searching through thousands of products from your selected brands"
    />
)}

{/* Brand Filter Modal */}
<BrandFilterModal
    isOpen={showBrandFilter}
    onClose={() => setShowBrandFilter(false)}
    onApply={(brands) => {
        setSelectedBrands(brands);
        loadRecommendedProducts();
    }}
    currentBrands={selectedBrands}
/>
