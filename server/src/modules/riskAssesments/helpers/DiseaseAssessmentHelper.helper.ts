// Define interface for patient data
interface PatientData {
  gender: string;
  age: number;
  race: number;
  systolicBP: number;
  onHypertensionMed: boolean;
  diabetes: boolean;
  smoker: boolean;
  hdlCholesterol: number;
  totalCholesterol: number;
}

// Define more specific type for gender
type Gender = 'F' | 'M' | 'female' | 'male';

// Enhanced interface with optional validation
interface RiskCalculationParams {
  gender: Gender;
  age: number;
  race: number;
  systolicBP: number;
  onHypertensionMed: boolean;
  diabetes: boolean;
  smoker: boolean;
  hdlCholesterol: number;
  totalCholesterol: number;
}

const calculateRisk = (patientData: RiskCalculationParams): number => {
  // Destructure all required parameters with validation
  const {
    gender,
    age,
    race,
    systolicBP,
    onHypertensionMed,
    diabetes,
    smoker,
    hdlCholesterol,
    totalCholesterol,
  }: RiskCalculationParams = patientData;

  // Input validation (uncommented if needed)
  // console.log(gender);
  // console.log(age);
  // console.log(race);
  // console.log(systolicBP);
  // console.log(hdlCholesterol);
  // console.log(totalCholesterol);

  // if (
  //   !gender ||
  //   !age ||
  //   !race ||
  //   !systolicBP ||
  //   !hdlCholesterol ||
  //   !totalCholesterol
  // ) {
  //   throw new Error("Missing required parameters for risk calculation");
  // }

  // Convert gender to numeric code
  const sexCode: number = gender === "F" || gender === "female" ? 1 : 2;
  const onHypertensionMedCode: number = onHypertensionMed ? 1 : 0;
  const diabetesCode: number = diabetes ? 1 : 0;
  const smokerCode: number = smoker ? 1 : 0;
  const cholesterolRatio: number = totalCholesterol / hdlCholesterol;

  // Female risk calculation formula
  const logitFemale: number =
    -12.82311 +
    0.106501 * age +
    0.43244 * race +
    0.000056 * Math.pow(systolicBP, 2) +
    0.017666 * systolicBP +
    0.731678 * onHypertensionMedCode +
    0.94397 * diabetesCode +
    1.00979 * smokerCode +
    0.151318 * cholesterolRatio +
    -0.00858 * age * race +
    -0.003647 * systolicBP * onHypertensionMedCode +
    0.006208 * systolicBP * race +
    0.152968 * race * onHypertensionMedCode +
    -0.000153 * age * systolicBP +
    0.115232 * race * diabetesCode +
    -0.092231 * race * smokerCode +
    0.070498 * race * cholesterolRatio +
    -0.000173 * race * systolicBP * onHypertensionMedCode +
    -0.000094 * age * systolicBP * race;

  // Male risk calculation formula
  const logitMale: number =
    -11.67998 +
    0.0642 * age +
    0.482835 * race +
    -0.000061 * Math.pow(systolicBP, 2) +
    0.03895 * systolicBP +
    2.055533 * onHypertensionMedCode +
    0.842209 * diabetesCode +
    0.895589 * smokerCode +
    0.193307 * cholesterolRatio +
    -0.014207 * systolicBP * onHypertensionMedCode +
    0.011609 * systolicBP * race +
    -0.11946 * onHypertensionMedCode * race +
    0.000025 * age * systolicBP +
    -0.077214 * race * diabetesCode +
    -0.226771 * race * smokerCode +
    -0.117749 * race * cholesterolRatio +
    0.00419 * race * onHypertensionMedCode * systolicBP +
    -0.000199 * race * age * systolicBP;

  // Calculate risk percentages
  const riskFemale: number = 100 / (1 + Math.exp(-logitFemale));
  const riskMale: number = 100 / (1 + Math.exp(-logitMale));

  // Select appropriate risk based on gender
  const risk: number =
    (sexCode === 1 ? riskFemale : 0) + (sexCode === 2 ? riskMale : 0);

  // Return risk rounded to 2 decimal places
  return Number(risk.toFixed(2));
};

export { calculateRisk };
export type { RiskCalculationParams, PatientData };
