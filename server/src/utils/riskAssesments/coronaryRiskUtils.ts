// Define risk level types for better type safety
type RiskLevel = "Low" | "Moderate" | "High" | "Very High";
type AgeGroup = "18-30" | "31-45" | "46-60" | "61+";

/**
 * Determine risk level based on risk percentage
 * @param riskPercentage - The calculated risk percentage
 * @returns Risk level category (Low, Moderate, High, Very High)
 */
const determineRiskLevel = (riskPercentage: number): RiskLevel => {
  if (riskPercentage < 5) {
    return "Low";
  } else if (riskPercentage >= 5 && riskPercentage < 20) {
    return "Moderate";
  } else if (riskPercentage >= 20 && riskPercentage < 30) {
    return "High";
  } else {
    return "Very High";
  }
};

/**
 * Determine age group based on age
 * @param age - The person's age
 * @returns Age group category
 */
const determineAgeGroup = (age: number): AgeGroup => {
  if (age <= 30) {
    return "18-30";
  } else if (age > 30 && age <= 45) {
    return "31-45";
  } else if (age > 45 && age <= 60) {
    return "46-60";
  } else {
    return "61+";
  }
};

export { determineRiskLevel, determineAgeGroup };
export type { RiskLevel, AgeGroup };
