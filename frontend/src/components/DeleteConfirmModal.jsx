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
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/5 bg-[#16161A] p-6 shadow-2xl z-10"
        >
          <div className="flex flex-col items-center text-center">
            {/* Warning Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
              <FiAlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="mb-2 text-lg font-semibold text-white">
              Delete Expense
            </h3>
            <p className="mb-6 text-sm text-[#9CA3AF]">
              Are you sure you want to delete this expense?
              <br />
              This action cannot be undone.
            </p>

            <div className="flex w-full gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-white/10 bg-transparent py-2.5 text-sm font-medium text-[#9CA3AF] transition-colors hover:bg-white/5 hover:text-white"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
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
