import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateCurrentBudget } from "../api/budget";
import { toast } from "react-toastify";

function BudgetSetupModal({ isOpen, onSuccess }) {
  const [budgetVal, setBudgetVal] = useState("20000");
  const [activeChip, setActiveChip] = useState("20K"); // '5K', '10K', '20K', '50K', 'custom'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  const inputRef = useRef(null);

  // Enable demo skip based on Vite env variables
  const enableDemoSkip = import.meta.env.VITE_ENABLE_DEMO_SKIP === "true";

  // Prevent escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown, true);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChipClick = (chip, value) => {
    setActiveChip(chip);
    if (chip === "custom") {
      setBudgetVal("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      setBudgetVal(value.toString());
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setBudgetVal(val);
    
    // Check if it matches presets to highlight correctly
    if (val === "5000") setActiveChip("5K");
    else if (val === "10000") setActiveChip("10K");
    else if (val === "20000") setActiveChip("20K");
    else if (val === "50000") setActiveChip("50K");
    else setActiveChip("custom");
  };

  const executeSubmit = async (finalAmount) => {
    setIsSubmitting(true);
    try {
      await updateCurrentBudget(finalAmount);
      
      // Trigger Success State
      setIsSuccess(true);
      
      // Count-up animation from 0 to finalAmount over 700ms
      const duration = 700;
      const startTime = performance.now();
      
      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing: easeOutQuad
        const easeProgress = progress * (2 - progress);
        
        setAnimatedValue(Math.floor(easeProgress * finalAmount));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedValue(finalAmount);
          // Wait another 1000ms before finishing
          setTimeout(() => {
            onSuccess(finalAmount);
          }, 1000);
        }
      };
      
      requestAnimationFrame(animate);
    } catch (error) {
      console.error("Failed to set budget:", error);
      toast.error(error.response?.data?.detail || "Failed to set budget. Please try again.", { theme: "dark" });
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(budgetVal);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a budget amount greater than 0.", { theme: "dark" });
      return;
    }
    executeSubmit(amount);
  };

  const handleDemoSkip = () => {
    executeSubmit(30000);
  };

  // Format helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop (Cannot dismiss by clicking) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-md overflow-hidden rounded-[20px] border border-white/5 bg-[#16161A] p-8 shadow-2xl z-10 text-white"
        >
          {!isSuccess ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <span className="text-3xl">Welcome Back 👋</span>
                <h3 className="text-lg font-bold text-white tracking-wide pt-2">
                  How much would you like to spend this month?
                </h3>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Input Container */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]">
                    Monthly Budget
                  </label>
                  <div className="relative flex items-center border-b-2 border-white/10 focus-within:border-[#A855F7] transition-colors py-2">
                    <span className="text-2xl font-extrabold text-white/50 pr-2">₹</span>
                    <input
                      ref={inputRef}
                      type="number"
                      value={budgetVal}
                      onChange={handleInputChange}
                      className="w-full bg-transparent text-3xl font-extrabold text-white focus:outline-none placeholder-white/10"
                      placeholder="0"
                      required
                      min="1"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Quick selection chips */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]">
                    Quick Options
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "₹5K", key: "5K", val: 5000 },
                      { label: "₹10K", key: "10K", val: 10000 },
                      { label: "₹20K", key: "20K", val: 20000 },
                      { label: "₹50K", key: "50K", val: 50000 },
                      { label: "Custom", key: "custom", val: null },
                    ].map((chip) => {
                      const isSelected = activeChip === chip.key;
                      return (
                        <motion.button
                          key={chip.key}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleChipClick(chip.key, chip.val)}
                          disabled={isSubmitting}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            isSelected
                              ? "bg-[#A855F7] border-primary text-white shadow-lg shadow-primary/20"
                              : "bg-[#0F0F11] border-white/5 text-[#9CA3AF] hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {chip.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Benefits section */}
                <div className="bg-[#0F0F11]/60 border border-white/5 rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]/60">
                    Why set a budget?
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#9CA3AF] font-medium">
                    <li className="flex items-center gap-2">
                      <span className="text-[#22C55E]">✓</span> Track spending
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#22C55E]">✓</span> Avoid overspending
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#22C55E]">✓</span> Get personalized AI spending insights
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#22C55E]">✓</span> Receive smart savings recommendations
                    </li>
                  </ul>
                </div>

                {/* Action button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting || !budgetVal}
                  className="w-full bg-[#A855F7] hover:bg-[#b56ef8] text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:hover:bg-[#A855F7]"
                >
                  {isSubmitting ? "Setting Budget..." : "Continue"}
                </motion.button>
              </form>

              {/* Demo skip link */}
              {enableDemoSkip && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleDemoSkip}
                    disabled={isSubmitting}
                    className="text-xs text-white/30 hover:text-white/60 underline font-medium transition-colors"
                  >
                    Skip for Demo (₹30K default)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-6 text-center space-y-6"
            >
              <div className="space-y-2">
                <span className="text-4xl block">🎉</span>
                <h3 className="text-xl font-bold text-white">
                  Budget Set Successfully
                </h3>
              </div>

              <div className="space-y-1 py-4">
                <p className="text-xs uppercase font-extrabold tracking-widest text-[#9CA3AF]/60">
                  Monthly Budget
                </p>
                <h2 className="text-4xl font-extrabold text-[#22C55E] tracking-tight">
                  {formatCurrency(animatedValue)}
                </h2>
              </div>

              <p className="text-sm text-[#9CA3AF] font-medium">
                We'll help you stay on track.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default BudgetSetupModal;
