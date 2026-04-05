/**
 * Helper functions for stress risk calculation
 */

// Define interfaces
interface PssQuestions {
  upsetByUnexpected?: number;
  unableToControl?: number;
  feltNervous?: number;
  confidentHandling?: number;
  thingsGoingWell?: number;
  couldNotCope?: number;
  controlIrritations?: number;
  onTopOfThings?: number;
  angryOutOfControl?: number;
  difficulties?: number;
}

interface RequestBody {
  pssQuestions: PssQuestions;
  age?: number;
  gender?: string;
  additionalFactors?: any;
}

interface StressRiskResult {
  pssScore: number;
  stressLevel: string;
}

// Calculate PSS score from the question responses
const calculatePSSScore = (pssQuestions: PssQuestions): number => {
  // Questions 4, 5, 7, and 8 are positively stated items and are scored in reverse
  // (0=4, 1=3, 2=2, 3=1, 4=0)
  const reverseScoredQuestions: string[] = [
    "confidentHandling",
    "thingsGoingWell",
    "controlIrritations",
    "onTopOfThings",
  ];

  let totalScore = 0;

  // Calculate each question's contribution to the score
  Object.entries(pssQuestions).forEach(([key, value]: [string, number]) => {
    if (reverseScoredQuestions.includes(key)) {
      // Reverse scoring for positive items
      totalScore += 4 - value;
    } else {
      // Normal scoring for negative items
      totalScore += value;
    }
  });

  return totalScore;
};

// Determine stress level based on PSS score
const determineStressLevel = (pssScore: number): string => {
  // Standard PSS score interpretation
  if (pssScore <= 13) {
    return "Low";
  } else if (pssScore <= 26) {
    return "Moderate";
  } else {
    return "High";
  }
};

// Main helper function for stress risk calculation
const calculateStressRiskHelper = (body: RequestBody): StressRiskResult => {
  const { pssQuestions } = body;

  // Calculate PSS score
  const pssScore: number = calculatePSSScore(pssQuestions);

  // Determine stress level
  const stressLevel: string = determineStressLevel(pssScore);

  return {
    pssScore,
    stressLevel,
  };
};

export {
  calculateStressRiskHelper,
  calculatePSSScore,
  determineStressLevel,
};

export type {
  PssQuestions,
  RequestBody,
  StressRiskResult,
};
