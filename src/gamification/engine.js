// src/gamification/engine.js
// Rules based on Volux Gamification Library (Points, Levels, Badges)

export const calculatePointsForCompletion = ({ hours = 0 }) => {
  // +2 points per 1 volunteering hour
  const safeHours = typeof hours === "number" && hours > 0 ? hours : 0;
  return safeHours * 2;
};

export const calculateLevel = (totalPoints) => {
  const p = typeof totalPoints === "number" ? totalPoints : 0;
  if (p >= 1200) return "Platinum";
  if (p >= 600) return "Gold";
  if (p >= 200) return "Silver";
  return "Bronze";
};

export const computeBadges = ({ totalPoints, completedOpportunities, currentBadges = [] }) => {
  const badges = Array.isArray(currentBadges) ? [...currentBadges] : [];
  const newlyEarned = [];

  const add = (name) => {
    if (!badges.includes(name)) {
      badges.push(name);
      newlyEarned.push(name);
    }
  };

  // Basic badges
  if (completedOpportunities >= 1) add("First Opportunity");
  if (completedOpportunities >= 3) add("Active Volunteer");

  const level = calculateLevel(totalPoints);
  if (level === "Silver") add("Level Silver");
  if (level === "Gold") add("Level Gold");
  if (level === "Platinum") add("Level Platinum");

  // Achievement badges
  if (completedOpportunities >= 10) add("Opportunity Finisher");
  if (totalPoints >= 500) add("Impact Maker");

  // Leadership & Advanced badges
  if (completedOpportunities >= 15) add("Trusted Volunteer");
  if (totalPoints >= 1000) add("Elite Member");

  // Admin approval / activity history required (kept for future without breaking UI)
  // - Consistency Star (3 consecutive months)
  // - Community Helper (continuous engagement)
  // - Change Maker (admin approval)

  return { badges, newlyEarned, level };
};
