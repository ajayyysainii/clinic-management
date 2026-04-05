// helpers/calculateLiverRisk.ts

// Define the types for the risk factors
interface DietaryHabits {
  regularMeals: boolean;
  frequentSnacks: boolean;
  processedFoods: boolean;
  sodaJuices: boolean;
  restaurantFood: boolean;
}

interface RiskFactors {
  age: "Under 40" | "41-60" | "Over 60";
  riskReasons: string[];
  diabetes: "Yes" | "No";
  highBloodPressure: "Yes" | "No";
  exercise: "Never" | "Less than 1 Hour per Week" | "1-2 Hours per Week" | "3-4 Hours per Week" | "Over 5 Hours per Week";
  alcohol: "Never" | "Monthly or Less" | "2-4 Times per Month" | "2-3 Times per Week" | "Over 4 Times per Week";
  dietaryHabits: DietaryHabits;
}

interface RiskResult {
  riskScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH";
}

const calculateLiverRiskHelper = (riskFactors: RiskFactors): RiskResult => {
  let riskScore: number = 0;

  // Age risk
  if (riskFactors.age === "41-60") riskScore += 1;
  else if (riskFactors.age === "Over 60") riskScore += 2;

  // Risk reasons
  riskFactors.riskReasons.forEach((reason: string) => {
    if (reason === "I am overweight") riskScore += 2;
    if (reason === "I drink alcohol frequently") riskScore += 3;
    if (reason === "I have a hereditary or autoimmune condition")
      riskScore += 2;
  });

  // Medical conditions
  if (riskFactors.diabetes === "Yes") riskScore += 2;
  if (riskFactors.highBloodPressure === "Yes") riskScore += 1;

  // Exercise habits
  switch (riskFactors.exercise) {
    case "Never":
      riskScore += 3;
      break;
    case "Less than 1 Hour per Week":
      riskScore += 2;
      break;
    case "1-2 Hours per Week":
      riskScore += 1;
      break;
    // No risk score added for "3-4 Hours per Week" and "Over 5 Hours per Week"
  }

  // Alcohol consumption
  switch (riskFactors.alcohol) {
    case "Over 4 Times per Week":
      riskScore += 4;
      break;
    case "2-3 Times per Week":
      riskScore += 3;
      break;
    case "2-4 Times per Month":
      riskScore += 2;
      break;
    case "Monthly or Less":
      riskScore += 1;
      break;
    // No risk score added for "Never"
  }

  // Dietary habits
  const { dietaryHabits }: { dietaryHabits: DietaryHabits } = riskFactors;
  if (!dietaryHabits.regularMeals) riskScore += 1;
  if (dietaryHabits.frequentSnacks) riskScore += 1;
  if (dietaryHabits.processedFoods) riskScore += 2;
  if (dietaryHabits.sodaJuices) riskScore += 2;
  if (dietaryHabits.restaurantFood) riskScore += 1;

  // Determine risk level
  let riskLevel: "LOW" | "MODERATE" | "HIGH";
  if (riskScore >= 13) riskLevel = "HIGH";
  else if (riskScore >= 6 && riskScore <= 12) riskLevel = "MODERATE";
  else riskLevel = "LOW"; // riskScore <= 5

  return { riskScore, riskLevel };
};

export { calculateLiverRiskHelper, type RiskFactors, type RiskResult, type DietaryHabits };
