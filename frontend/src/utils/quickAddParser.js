/**
 * Parse natural text into structured expense fields using regex and keyword matching.
 * 
 * Examples:
 * "Spent ₹250 on Burger" -> { amount: 250, category: "Food", description: "Burger" }
 * "Uber Ride ₹500"       -> { amount: 500, category: "Transport", description: "Uber Ride" }
 * "Cab ₹200"             -> { amount: 200, category: "Transport", description: "Cab" }
 * "Pizza ₹350"           -> { amount: 350, category: "Food", description: "Pizza" }
 */
export const parseExpenseText = (text) => {
  const cleaned = text.trim();
  if (!cleaned) {
    return { amount: 0, category: "Others", description: "" };
  }

  // 1. Extract Amount
  // Matches optional currency symbols followed by numbers (with optional decimals)
  const amountMatch = cleaned.match(/(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  // 2. Identify Category by Keyword Matching
  let category = "Others";
  const textLower = cleaned.toLowerCase();
  
  if (
    textLower.includes("food") ||
    textLower.includes("pizza") ||
    textLower.includes("burger") ||
    textLower.includes("coffee") ||
    textLower.includes("eat") ||
    textLower.includes("lunch") ||
    textLower.includes("dinner") ||
    textLower.includes("breakfast") ||
    textLower.includes("restaurant") ||
    textLower.includes("starbucks") ||
    textLower.includes("mcdonald") ||
    textLower.includes("cafe") ||
    textLower.includes("tea") ||
    textLower.includes("biryani")
  ) {
    category = "Food";
  } else if (
    textLower.includes("transport") ||
    textLower.includes("uber") ||
    textLower.includes("cab") ||
    textLower.includes("ride") ||
    textLower.includes("taxi") ||
    textLower.includes("metro") ||
    textLower.includes("bus") ||
    textLower.includes("train") ||
    textLower.includes("flight") ||
    textLower.includes("travel")
  ) {
    category = "Transport";
  } else if (
    textLower.includes("shopping") ||
    textLower.includes("dress") ||
    textLower.includes("shirt") ||
    textLower.includes("jeans") ||
    textLower.includes("clothes") ||
    textLower.includes("shoes") ||
    textLower.includes("amazon") ||
    textLower.includes("myntra") ||
    textLower.includes("flipkart") ||
    textLower.includes("buy") ||
    textLower.includes("bought") ||
    textLower.includes("store")
  ) {
    category = "Shopping";
  } else if (
    textLower.includes("entertainment") ||
    textLower.includes("movie") ||
    textLower.includes("theater") ||
    textLower.includes("cinema") ||
    textLower.includes("netflix") ||
    textLower.includes("spotify") ||
    textLower.includes("game") ||
    textLower.includes("gaming") ||
    textLower.includes("play") ||
    textLower.includes("concert") ||
    textLower.includes("show") ||
    textLower.includes("fun")
  ) {
    category = "Entertainment";
  } else if (
    textLower.includes("health") ||
    textLower.includes("gym") ||
    textLower.includes("doctor") ||
    textLower.includes("medicine") ||
    textLower.includes("medical") ||
    textLower.includes("clinic") ||
    textLower.includes("pharmacy") ||
    textLower.includes("hospital") ||
    textLower.includes("workout")
  ) {
    category = "Health";
  }

  // 3. Extract Description
  let description = cleaned;

  // Remove the matched amount and currency part
  if (amountMatch) {
    description = description.replace(amountMatch[0], "");
  }

  // Remove common transactional words/prepositions
  description = description.replace(/\b(?:spent|paid|bought|for|on|in|to)\b/gi, "");

  // Clean whitespace
  description = description.replace(/\s+/g, " ").trim();

  // Capitalize first letter
  if (description) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  } else {
    description = `Quick ${category} Expense`;
  }

  return { amount, category, description };
};
