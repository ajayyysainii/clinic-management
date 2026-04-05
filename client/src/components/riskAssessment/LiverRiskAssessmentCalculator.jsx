
import { useState } from "react";
// import { useParams } from "react-router-dom";
import { 
  User, 
  Calendar, 
  Heart, 
  Activity, 
  Wine, 
  Apple, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Stethoscope 
} from "lucide-react";
import axios from "axios";
import {BACKEND_URL} from "../../utils/urlConstants";


const LiverRiskAssessmentCalculator = ({ onCalculateLiverRisk, latestEmrData = {}, userId }) => {
//   const { id } = useParams();
// const id = "687eab0a72d7830b9fd47f40";
  const [riskFactors, setRiskFactors] = useState({
    age: latestEmrData?.age || "",
    gender: latestEmrData?.gender ? ((latestEmrData?.gender === 'M' || latestEmrData?.gender?.toLowerCase() === 'male') ? 'Male' : 'Female') : "",
    riskReasons: [],
    diabetes: "",
    highBloodPressure: "",
    exercise: "",
    alcohol: "",
    dietaryHabits: {
      regularMeals: false,
      frequentSnacks: false,
      processedFoods: false,
      sodaJuices: false,
      restaurantFood: false,
    },
  });

  const [riskLevel, setRiskLevel] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRiskFactorChange = (factor, value) => {
    setRiskFactors((prev) => ({ ...prev, [factor]: value }));
  };

  const handleRiskReasonsChange = (reason) => {
    setRiskFactors((prev) => ({
      ...prev,
      riskReasons: prev.riskReasons.includes(reason)
        ? prev.riskReasons.filter((r) => r !== reason)
        : [...prev.riskReasons, reason],
    }));
  };

  const handleDietaryHabitChange = (habit) => {
    setRiskFactors((prev) => ({
      ...prev,
      dietaryHabits: {
        ...prev.dietaryHabits,
        [habit]: !prev.dietaryHabits[habit],
      },
    }));
  };

  const calculateRisk = async () => {
    setIsSubmitting(true);
    let riskScore = 0;

    // Age risk
    const parsedAge = parseInt(riskFactors.age);
    if (parsedAge > 40 && parsedAge <= 60) riskScore += 1;
    else if (parsedAge > 60) riskScore += 2;

    // Other risk factors
    riskFactors.riskReasons.forEach((reason) => {
      if (reason === "I am overweight") riskScore += 2;
      if (reason === "I drink alcohol frequently") riskScore += 3;
      if (reason === "I have a hereditary or autoimmune condition")
        riskScore += 2;
    });

    if (riskFactors.diabetes === "Yes") riskScore += 2;
    if (riskFactors.highBloodPressure === "Yes") riskScore += 1;

    // Exercise
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
      // "Over 2.5 Hours per Week" doesn't add to risk score
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
      // "Never" doesn't add to risk score
    }

    // Dietary habits
    if (!riskFactors.dietaryHabits.regularMeals) riskScore += 1;
    if (riskFactors.dietaryHabits.frequentSnacks) riskScore += 1;
    if (riskFactors.dietaryHabits.processedFoods) riskScore += 2;
    if (riskFactors.dietaryHabits.sodaJuices) riskScore += 2;
    if (riskFactors.dietaryHabits.restaurantFood) riskScore += 1;

    let riskLevel = "";

    // Determine risk level
    if (riskScore > 15) riskLevel = "HIGH";
    else if (riskScore > 8) riskLevel = "MODERATE";
    else riskLevel = "LOW";

    try {
        // Get auth token from localStorage
        const token = localStorage.getItem('authtoken');
        
        const response = await axios.post(`${BACKEND_URL}/liver`, {
        ...riskFactors,
        riskLevel,
        riskScore,
        user: userId,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = response.data;
      alert(res.message);
      setRiskLevel(riskLevel);
      setTimeout(() => {
        onCalculateLiverRisk(
          res.data._id,
          res.data.riskScore,
          res.data.riskLevel,
          res.data.createdAt
        );
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const RadioOption = ({ name, value, currentValue, onChange, children }) => (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={currentValue === value}
        onChange={(e) => onChange(e.target.value)}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
      />
      <span className="text-sm text-gray-700">{children}</span>
    </label>
  );

  const CheckboxOption = ({ checked, onChange, children }) => (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
      />
      <span className="text-sm text-gray-700">{children}</span>
    </label>
  );

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'MODERATE':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'HIGH':
        return <AlertTriangle className="w-6 h-6" />;
      case 'MODERATE':
        return <Info className="w-6 h-6" />;
      case 'LOW':
        return <CheckCircle className="w-6 h-6" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Liver Risk Assessment Calculator</h1>
        <p className="text-gray-600">Complete this assessment to evaluate your liver disease risk factors</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          calculateRisk();
        }}
        className="space-y-6"
      >
        {/* Age Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Age</h3>
          </div>
          <input
            required
            type="number"
            placeholder="Enter your age"
            value={riskFactors.age}
            onChange={(e) => handleRiskFactorChange("age", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Gender Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Gender</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            {["Male", "Female", "Prefer not to say"].map((option) => (
              <RadioOption
                key={option}
                name="gender"
                value={option}
                currentValue={riskFactors.gender}
                onChange={(value) => handleRiskFactorChange("gender", value)}
              >
                {option}
              </RadioOption>
            ))}
          </div>
        </div>

        {/* Risk Reasons Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Risk Factors</h3>
          </div>
          <p className="text-gray-600 mb-4">Why do you think you are at risk of liver disease? (Select all that apply)</p>
          <div className="space-y-3">
            {[
              "I am overweight",
              "I drink alcohol frequently",
              "I have a hereditary or autoimmune condition",
            ].map((option) => (
              <CheckboxOption
                key={option}
                checked={riskFactors.riskReasons.includes(option)}
                onChange={() => handleRiskReasonsChange(option)}
              >
                {option}
              </CheckboxOption>
            ))}
          </div>
        </div>

        {/* Diabetes Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <Heart className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Type 2 Diabetes</h3>
          </div>
          <p className="text-gray-600 mb-4">Do you have Type 2 Diabetes?</p>
          <div className="flex gap-4">
            {["Yes", "No"].map((option) => (
              <RadioOption
                key={option}
                name="diabetes"
                value={option}
                currentValue={riskFactors.diabetes}
                onChange={(value) => handleRiskFactorChange("diabetes", value)}
              >
                {option}
              </RadioOption>
            ))}
          </div>
        </div>

        {/* High Blood Pressure Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <Stethoscope className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">High Blood Pressure</h3>
          </div>
          <p className="text-gray-600 mb-4">Do you have High Blood Pressure?</p>
          <div className="flex gap-4">
            {["Yes", "No"].map((option) => (
              <RadioOption
                key={option}
                name="highBloodPressure"
                value={option}
                currentValue={riskFactors.highBloodPressure}
                onChange={(value) => handleRiskFactorChange("highBloodPressure", value)}
              >
                {option}
              </RadioOption>
            ))}
          </div>
        </div>

        {/* Exercise Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <Activity className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Exercise Frequency</h3>
          </div>
          <p className="text-gray-600 mb-2">How often do you exercise?</p>
          <p className="text-sm text-gray-500 mb-4">
            Exercise is defined as any activity leaving you warm and slightly out of breath. 
            These activities can include: brisk walking, swimming, cycling, running, playing a sport, 
            joining a group or attending a regular exercise class.
          </p>
          <div className="space-y-2">
            {[
              "Over 2.5 Hours per Week",
              "1-2 Hours per Week",
              "Less than 1 Hour per Week",
              "Never",
            ].map((option) => (
              <RadioOption
                key={option}
                name="exercise"
                value={option}
                currentValue={riskFactors.exercise}
                onChange={(value) => handleRiskFactorChange("exercise", value)}
              >
                {option}
              </RadioOption>
            ))}
          </div>
        </div>

        {/* Alcohol Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <Wine className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Alcohol Consumption</h3>
          </div>
          <p className="text-gray-600 mb-4">How often do you drink alcohol?</p>
          <div className="space-y-2">
            {[
              "Never",
              "Monthly or Less",
              "2-4 Times per Month",
              "2-3 Times per Week",
              "Over 4 Times per Week",
            ].map((option) => (
              <RadioOption
                key={option}
                name="alcohol"
                value={option}
                currentValue={riskFactors.alcohol}
                onChange={(value) => handleRiskFactorChange("alcohol", value)}
              >
                {option}
              </RadioOption>
            ))}
          </div>
        </div>

        {/* Dietary Habits Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <Apple className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Dietary Habits</h3>
          </div>
          <p className="text-gray-600 mb-4">What are your dietary habits? (Check all that apply)</p>
          <div className="space-y-3">
            <CheckboxOption
              checked={riskFactors.dietaryHabits.regularMeals}
              onChange={() => handleDietaryHabitChange("regularMeals")}
            >
              I do NOT regularly have three meals a day including breakfast.
            </CheckboxOption>
            <CheckboxOption
              checked={riskFactors.dietaryHabits.frequentSnacks}
              onChange={() => handleDietaryHabitChange("frequentSnacks")}
            >
              I eat snacks more than 3 times per week.
            </CheckboxOption>
            <CheckboxOption
              checked={riskFactors.dietaryHabits.processedFoods}
              onChange={() => handleDietaryHabitChange("processedFoods")}
            >
              I eat processed foods more than 3 times per week.
            </CheckboxOption>
            <CheckboxOption
              checked={riskFactors.dietaryHabits.sodaJuices}
              onChange={() => handleDietaryHabitChange("sodaJuices")}
            >
              I drink soda & juices more than 3 times per week.
            </CheckboxOption>
            <CheckboxOption
              checked={riskFactors.dietaryHabits.restaurantFood}
              onChange={() => handleDietaryHabitChange("restaurantFood")}
            >
              I eat restaurant food more than 3 times per week.
            </CheckboxOption>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Risk Level Results */}
      {riskLevel && (
        <div className="mt-8">
          <div className={`p-6 rounded-lg border-2 ${getRiskLevelColor(riskLevel)}`}>
            <div className="flex items-center mb-4">
              {getRiskIcon(riskLevel)}
              <h2 className="text-2xl font-bold ml-3">
                You are at {riskLevel} RISK for Liver Disease
              </h2>
            </div>
            
            <div className="space-y-4 text-sm">
              <p>
                Thank you for completing the Liver Disease Risk Calculator and
                taking the first step to improving your liver health.
              </p>
              
              <p>
                {riskLevel !== "LOW"
                  ? "Based on your answers, your lifestyle and habits can be improved to reduce your risk of liver disease."
                  : "Your current lifestyle seems to be supporting good liver health. Keep up the good work!"}
              </p>
              
              <div>
                <p className="font-semibold mb-2">
                  Remember that prevention is better than cure. The best things you
                  can do to prevent liver disease are:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Maintain a healthy weight</li>
                  <li>Eat a balanced diet</li>
                  <li>Exercise regularly</li>
                  <li>Limit alcohol consumption</li>
                  <li>Get regular health checkups</li>
                </ul>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-800">
                  📅 Book an appointment with Preva Care for personalized guidance
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiverRiskAssessmentCalculator;
