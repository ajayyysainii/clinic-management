const determineLiverRiskLevel = (riskScore: number): string => {
  if (riskScore <= 5) {
    return "Low";
  } else if (riskScore >= 6 && riskScore <= 12) {
    return "Moderate";
  } else {
    return "High"; // riskScore >= 13
  }
};

export {
  determineLiverRiskLevel,
};

