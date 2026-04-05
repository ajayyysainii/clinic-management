/**
 * Determine risk level based on average of lower and higher risk scores
 * @param lowerRiskScore - Lower bound risk score
 * @param higherRiskScore - Higher bound risk score
 * @returns Risk level category (Low, Moderate, High)
 */
const determineStrokeRiskLevel = (lowerRiskScore: number, higherRiskScore: number): string => {
  // Calculate total score (sum of lower and higher risk scores)
  const totalScore = lowerRiskScore + higherRiskScore;

  if (totalScore <= 2) {
    return "Low";
  } else if (totalScore >= 3 && totalScore <= 6) {
    return "Moderate";
  } else {
    return "High"; // totalScore >= 7
  }
};

export {
  determineStrokeRiskLevel,
};
