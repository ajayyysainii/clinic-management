import { useState } from "react";
// import { useParams } from "react-router";
import axios from "axios";
import { BACKEND_URL } from "../../utils/urlConstants";

const StrokeRiskAssessmentCalculator = ({ onCalculateStrokeRisk = null,userId }) => {

  const [riskFactors, setRiskFactors] = useState({
    bloodPressure: null,
    atrialFibrillation: null,
    bloodSugar: null,
    bmi: null,
    diet: null,
    cholesterol: null,
    diabetes: null,
    physicalActivity: null,
    history: null,
    tobacco: null,
  });

  const [desc, setDesc] = useState("");
  const [higherRiskScore, setHigherRiskScore] = useState(0);
  const [lowerRiskScore, setLowerRiskScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRiskFactorChange = (factor, value) => {
    setRiskFactors((prev) => ({ ...prev, [factor]: value }));
  };

  const calculateRisk = async () => {
    setIsSubmitting(true);
    let higherRisk = 0;
    let lowerRisk = 0;

    Object.values(riskFactors).forEach((value) => {
      if (value === "higher") higherRisk += 1;
      if (value === "lower") lowerRisk += 1;
    });

    const desc =
      higherRisk > lowerRisk
        ? "You scored higher in the 'higher risk' column. It's recommended that you ask your health care professional about how you can reduce your risk."
        : "Your score indicates a lower risk, but always consult with a healthcare professional for a thorough assessment.";

    const dataToSendInDb = Object.fromEntries(
      Object.entries(riskFactors).filter(([, value]) => value !== null)
    );

    // Get auth token from localStorage
    const token = localStorage.getItem('authtoken');
    
    try {
      const res = await axios.post(`${BACKEND_URL}/stroke/create`, {
        ...dataToSendInDb,
        user: userId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Stroke risk assessment created successfully:', res.data.message);

      setDesc(desc);
      setHigherRiskScore(higherRisk);
      setLowerRiskScore(lowerRisk);
      
      // Call the callback function if provided
      if (onCalculateStrokeRisk && typeof onCalculateStrokeRisk === 'function') {
        onCalculateStrokeRisk(
          res.data.data._id,
          res.data.data.lowerRiskScore,
          res.data.data.higherRiskScore,
          res.data.data.desc,
          res.data.data.createdAt
        );
      }
    } catch (err) {
      console.error('Error creating stroke risk assessment:', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const riskFactorQuestions = [
    {
      key: "bloodPressure",
      question: "Is your blood pressure greater than 120/80mm/Hg?",
    },
    {
      key: "atrialFibrillation",
      question: "Have you been diagnosed with atrial fibrillation?",
    },
    {
      key: "bloodSugar",
      question: "Is your blood sugar greater than 100 mg/dL?",
    },
    { key: "bmi", question: "Is your body mass index greater than 25kg/m2?" },
    {
      key: "diet",
      question:
        "Is your diet high in saturated fat, trans fat, sweetened beverages, salt, excess calories?",
    },
    {
      key: "cholesterol",
      question: "Is your total blood cholesterol greater than 160mg/dL?",
    },
    {
      key: "diabetes",
      question: "Have you been diagnosed with diabetes mellitus?",
    },
    {
      key: "physicalActivity",
      question:
        "Do you get less than 150 minutes of moderate to vigorous-intensity activity per week?",
    },
    {
      key: "history",
      question:
        "Do you have a personal or family history of stroke, TIA or heart attack?",
    },
    { key: "tobacco", question: "Do you use tobacco or vape?" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            calculateRisk();
          }}
        >
          {riskFactorQuestions.map(({ key, question }, index) => (
            <div
              key={key}
              className="bg-white rounded-lg shadow-md border border-gray-200 mb-4 p-6"
            >
              <h3 className="text-gray-800 text-base font-normal mb-4">
                {index + 1}. {question}
              </h3>
              <div className="flex gap-8">
                <div className="inline-flex items-center">
                  <label className="relative flex items-center cursor-pointer" htmlFor={`${key}-higher`}>
                    <input
                      name={key}
                      type="radio"
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-blue-500 transition-all"
                      id={`${key}-higher`}
                      value="higher"
                      onChange={(e) => handleRiskFactorChange(key, e.target.value)}
                    />
                    <span className="absolute bg-blue-600 w-3 h-3 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></span>
                  </label>
                  <label
                    className="ml-3 text-gray-700 cursor-pointer text-sm"
                    htmlFor={`${key}-higher`}
                  >
                    Yes or unknown
                  </label>
                </div>
                <div className="inline-flex items-center">
                  <label className="relative flex items-center cursor-pointer" htmlFor={`${key}-lower`}>
                    <input
                      name={key}
                      type="radio"
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-blue-500 transition-all"
                      id={`${key}-lower`}
                      value="lower"
                      onChange={(e) => handleRiskFactorChange(key, e.target.value)}
                    />
                    <span className="absolute bg-blue-600 w-3 h-3 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></span>
                  </label>
                  <label
                    className="ml-3 text-gray-700 cursor-pointer text-sm"
                    htmlFor={`${key}-lower`}
                  >
                    No
                  </label>
                </div>
              </div>
            </div>
          ))}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Calculating...
              </>
            ) : (
              'Calculate Risk'
            )}
          </button>
        </form>
      </div>

      {(higherRiskScore > 0 || lowerRiskScore > 0) && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Stroke Risk Assessment Results
          </h2>
          <p className="text-gray-800 text-base mb-4">
            Risk Score: {((higherRiskScore + lowerRiskScore) / 2).toFixed(2)}
          </p>
          <p className="text-gray-800 text-base mb-4">
            {desc}
          </p>
          <p className="text-gray-800 text-base font-semibold">
            Remember: Stroke is largely preventable, treatable and beatable.
          </p>
        </div>
      )}
    </div>
  );
};

export default StrokeRiskAssessmentCalculator;
