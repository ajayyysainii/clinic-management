/**
 * Determine risk level based on total score
 * @param totalScore - The calculated total score (0-100)
 * @returns Risk level category (Low, Moderate, High)
 */
const determineDiabeticRiskLevel = (totalScore: number): string => {
  if (totalScore < 30) {
    return "Low";
  } else if (totalScore >= 30 && totalScore <= 50) {
    return "Moderate";
  } else {
    return "High";
  }
};

/**
 * Determine age group based on age
 * @param age - The person's age
 * @returns Age group category
 */
const determineDiabeticAgeGroup = (age: number): string => {
  if (age < 40) {
    return "20-39";
  } else if (age >= 40 && age < 60) {
    return "40-59";
  } else {
    return "60+";
  }
};

/**
 * Maps gender to appropriate format for recommendations lookup
 * @param gender - The gender (Male, Female, M, F, etc.)
 * @param ageGroup - The age group category
 * @returns Standardized gender for recommendations (Male, Female, All)
 */
const mapGenderForDiabeticRecommendations = (gender: string, ageGroup: string): string => {
  // For age groups where recommendations are the same for all genders
  if (ageGroup === "20-39" || ageGroup === "60+") {
    return "All";
  }

  // For middle age group, differentiate between male and female if possible
  if (gender) {
    const normalizedGender = String(gender).toLowerCase();
    if (normalizedGender === "m" || normalizedGender === "male") {
      return "Male";
    } else if (normalizedGender === "f" || normalizedGender === "female") {
      return "Female";
    }
  }

  // Default to All if gender is null, empty, ambiguous or other
  return "All";
};

export {
  determineDiabeticRiskLevel,
  determineDiabeticAgeGroup,
  mapGenderForDiabeticRecommendations,
};
