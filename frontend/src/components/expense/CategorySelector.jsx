import { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";
import { getCategoryEmoji, getCategoryStyles } from "../../constants/categories";
import CategoryDropdown from "./CategoryDropdown";
import AddCategoryModal from "./AddCategoryModal";
import { useCategoryStore } from "../../store/categoryStore";
import { useExpenseStore } from "../../store/expenseStore";
import { toast } from "react-toastify";

export default function CategorySelector({
  selectedCategory,
  onChange,
  error
}) {
  const { categories, fetchCategories, deleteCategory, restoreCategory } = useCategoryStore();
  const { expenses } = useExpenseStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [affectedExpensesCount, setAffectedExpensesCount] = useState(0);
  
  const containerRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Click away listener to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trace categories after refresh
  useEffect(() => {
    console.log("Step 6: categories after refresh:", categories);
  }, [categories]);

  // Trace selectedCategory changes
  useEffect(() => {
    console.log("Step 7: selectedCategory changed. Value:", selectedCategory);
  }, [selectedCategory]);

  const handleSelect = (categoryId) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const handleCategoryCreated = (newCategory) => {
    console.log("Step 6: categories before refresh:", categories);
    console.log("Step 7: selectedCategory before create:", selectedCategory);
    
    // Select the new category by ID
    console.log("Step 7: selectedCategory after create / pending refresh ID:", newCategory.id);
    onChange(newCategory.id);
    
    setIsOpen(false);
    setIsModalOpen(false);
  };

  const handleDeleteClick = (cat) => {
    // Count expenses using this category
    const count = expenses.filter((e) => e.category_id === cat.id).length;
    setAffectedExpensesCount(count);
    setCategoryToDelete(cat);
    setIsOpen(false);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    const cat = categoryToDelete;
    setCategoryToDelete(null);

    // If currently selected, fallback to None or Others
    if (selectedCategory === cat.id) {
      // Find the ID of the 'Others' category
      const others = categories.find((c) => c.name.toLowerCase() === "others");
      onChange(others ? others.id : "");
    }

    try {
      // Execute soft-delete on the backend
      await deleteCategory(cat.id);
      
      // Also refresh expenses list dynamically in the background since they migrated to Others
      useExpenseStore.getState().fetchExpenses();

      // Show Undo Toast
      const toastId = toast.info(
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold">Category "{cat.name}" deleted.</span>
          <button
            onClick={async () => {
              try {
                await restoreCategory(cat.id);
                // Refresh expenses again to recover from migration
                useExpenseStore.getState().fetchExpenses();
                toast.dismiss(toastId);
                toast.success(`Category "${cat.name}" restored!`, { theme: "light" });
              } catch (restoreErr) {
                console.error("Failed to restore:", restoreErr);
                toast.error("Unable to restore category.");
              }
            }}
            className="text-xs font-bold uppercase tracking-wider text-white hover:text-white/80 bg-[#5B4CF0] px-2.5 py-1 rounded-lg"
          >
            Undo
          </button>
        </div>,
        {
          autoClose: 5000,
          closeOnClick: false,
          draggable: false
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Unable to delete category. Please try again.");
    }
  };

  // Find metadata of currently selected category
  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const selectedEmoji = selectedCategoryObj ? getCategoryEmoji(selectedCategoryObj.icon_key) : "📦";
  const selectedStyle = selectedCategoryObj ? getCategoryStyles(selectedCategoryObj.color) : null;

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5 select-none">
        Category
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#F1F5F9] border border-[#E5E7EB] hover:border-[#6B7280]/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-[#111827] focus:outline-none transition-colors text-sm font-semibold select-none cursor-pointer"
      >
        {selectedCategoryObj ? (
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">{selectedEmoji}</span>
            <span className="truncate">{selectedCategoryObj.name}</span>
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ml-1"
              style={{ backgroundColor: selectedStyle?.hex || "#94A3B8" }}
            />
          </div>
        ) : (
          <span className="text-[#6B7280]/60">Select Category</span>
        )}
        <FiChevronDown
          className={`h-4 w-4 text-[#6B7280] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {error && <p className="mt-1 text-xs text-red-600 font-semibold">{error}</p>}

      {/* Dropdown list */}
      {isOpen && (
        <CategoryDropdown
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleSelect}
          onDeleteClick={handleDeleteClick}
          onAddNewClick={() => {
            setIsOpen(false);
            setIsModalOpen(true);
          }}
        />
      )}

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setCategoryToDelete(null)} 
          />
          {/* Modal box */}
          <div className="relative max-w-sm w-full bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-lg z-10 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-[#111827]">Delete "{categoryToDelete.name}"?</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              {affectedExpensesCount > 0 ? (
                <>
                  <span className="font-bold text-red-600">{affectedExpensesCount} expenses</span> currently use this category.
                  They will automatically be moved to <span className="font-semibold text-[#111827]">Others</span>.
                </>
              ) : (
                "This category will be deleted."
              )}
              <br />
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-[#6B7280] bg-white border border-[#E5E7EB] rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
