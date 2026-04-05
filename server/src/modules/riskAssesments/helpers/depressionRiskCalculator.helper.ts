/**
 * Helper functions for depression risk calculation using PHQ-9
 */

// Define interfaces and types
interface PhqQuestions {
  littleInterest?: number;
  feelingDown?: number;
  sleepIssues?: number;
  feelingTired?: number;
  appetiteIssues?: number;
  feelingBad?: number;
  concentrationIssues?: number;
  movingSpeaking?: number;
  suicidalThoughts?: number;
}

interface RequestBody {
  phqQuestions: PhqQuestions;
  age?: number;
  gender?: string;
  additionalFactors?: any;
}

interface DepressionRiskResult {
  phqScore: number;
  depressionLevel: DepressionLevel;
}

// Define depression level enum for better type safety
enum DepressionLevel {
  MINIMAL = "Minimal",
  MILD = "Mild",
  MODERATE = "Moderate",
  MODERATELY_SEVERE = "Moderately Severe",
  SEVERE = "Severe",
}

// PHQ-9 score thresholds
interface PhqThresholds {
  minimal: number;
  mild: number;
  moderate: number;
  moderatelySevere: number;
}

const PHQ_THRESHOLDS: PhqThresholds = {
  minimal: 4,
  mild: 9,
  moderate: 14,
  moderatelySevere: 19,
};

/**
 * Calculate PHQ-9 score from the question responses
 * @param phqQuestions - Object containing PHQ-9 question responses (0-3 each)
 * @returns Total PHQ-9 score (0-27)
 */
const calculatePHQScore = (phqQuestions: PhqQuestions): number => {
  // Input validation
  if (!phqQuestions || typeof phqQuestions !== 'object') {
    throw new Error('PHQ questions must be provided as an object');
  }

  let totalScore = 0;

  // Add up all question scores with validation
  Object.entries(phqQuestions).forEach(([key, value]) => {
    if (typeof value === 'number') {
      if (value < 0 || value > 3) {
        throw new Error(`Invalid score for ${key}: must be between 0 and 3`);
      }
      totalScore += value;
    }
  });

  // Validate total score range
  if (totalScore < 0 || totalScore > 27) {
    throw new Error('Total PHQ score must be between 0 and 27');
  }

  return totalScore;
};

/**
 * Determine depression level based on PHQ-9 score
 * @param phqScore - Total PHQ-9 score (0-27)
 * @returns Depression level classification
 */
const determineDepressionLevel = (phqScore: number): DepressionLevel => {
  // Input validation
  if (typeof phqScore !== 'number' || isNaN(phqScore)) {
    throw new Error('PHQ score must be a valid number');
  }

  if (phqScore < 0 || phqScore > 27) {
    throw new Error('PHQ score must be between 0 and 27');
  }

  // Standard PHQ-9 score interpretation
  if (phqScore <= PHQ_THRESHOLDS.minimal) {
    return DepressionLevel.MINIMAL;
  } else if (phqScore <= PHQ_THRESHOLDS.mild) {
    return DepressionLevel.MILD;
  } else if (phqScore <= PHQ_THRESHOLDS.moderate) {
    return DepressionLevel.MODERATE;
  } else if (phqScore <= PHQ_THRESHOLDS.moderatelySevere) {
    return DepressionLevel.MODERATELY_SEVERE;
  } else {
    return DepressionLevel.SEVERE;
  }
};

/**
 * Main helper function for depression risk calculation
 * @param body - Request body containing PHQ questions and other data
 * @returns Object containing PHQ score and depression level
 */
const calculateDepressionRiskHelper = (body: RequestBody): DepressionRiskResult => {
  // Input validation
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be provided');
  }

  const { phqQuestions } = body;

  if (!phqQuestions) {
    throw new Error('PHQ questions are required');
  }

  // Calculate PHQ-9 score
  const phqScore: number = calculatePHQScore(phqQuestions);

  // Determine depression level
  const depressionLevel: DepressionLevel = determineDepressionLevel(phqScore);

  return {
    phqScore,
    depressionLevel,
  };
};

export {
  calculateDepressionRiskHelper,
  calculatePHQScore,
  determineDepressionLevel,
  DepressionLevel,
  PHQ_THRESHOLDS,
};

export type {
  PhqQuestions,
  RequestBody,
  DepressionRiskResult,
  PhqThresholds,
};
