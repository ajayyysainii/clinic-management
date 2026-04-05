// helpers/calculateDiabeticRisk.ts

interface DiabeticRiskScores {
  ageScore: number;
  waistScore: number;
  physicalActivityScore: number;
  familyHistoryScore: number;
}

interface DiabeticRiskResult {
  totalScore: number;
  riskLevel: string;
}

const calculateDiabeticRiskHelper = (scores: DiabeticRiskScores): DiabeticRiskResult => {
  const totalScore =
    scores.ageScore +
    scores.waistScore +
    scores.physicalActivityScore +
    scores.familyHistoryScore;

  let riskLevel = "";

  if (totalScore > 50) {
    riskLevel = "High";
  } else if (totalScore >= 30 && totalScore <= 50) {
    riskLevel = "Moderate";
  } else {
    riskLevel = "Low";
  }

  return { totalScore, riskLevel };
};

export { calculateDiabeticRiskHelper };
export type { DiabeticRiskScores, DiabeticRiskResult };
