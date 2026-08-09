import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle } from "react-icons/fi";

function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full max-w-md overflow-hidden rounded-dialog border border-default bg-surface p-6 shadow-md z-10"
        >
          <div className="flex flex-col items-center text-center">
            {/* Warning Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-100 text-[#EF4444]">
              <FiAlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="mb-2 text-lg font-bold text-[#111827]">
              Delete Expense
            </h3>
            <p className="mb-6 text-[15px] text-[#6B7280] font-normal leading-relaxed">
              Are you sure you want to delete this expense?
              <br />
              This action cannot be undone.
            </p>

            <div className="flex w-full gap-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 rounded-btn border border-default bg-surface py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-[#F1F5F9] cursor-pointer"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 rounded-btn bg-danger py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default DeleteConfirmModal;
