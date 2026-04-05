import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../utils/urlConstants";

const DiabeticRiskCalculator = ({ onCalculateDiabeticRisk = null, latestEmrData = {} }) => {
//   const { employeeId, individualUserId } = useParams();
const userId = "687eab0a72d7830b9fd47f40"
  
  const getAgeScore = (age) => {
    if (!age || age < 35) {
      return 0;
    }
    if (age >= 35 && age < 50) {
      return 20;
    }
    return 30;
  };

  const [formData, setFormData] = useState({
    user: userId,
    ageScore: getAgeScore(latestEmrData?.age || 0),
    waistScore: 0,
    physicalActivityScore: 0,
    familyHistoryScore: 0,
    totalScore: 0,
    riskLevel: "",
  });

  const calculateRisk = async () => {
    try {
      const score =
        formData.ageScore +
        formData.waistScore +
        formData.physicalActivityScore +
        formData.familyHistoryScore;

      let risk = "";

      if (score >= 60) {
        risk = "Very High";
      } else if (score >= 30 && score <= 50) {
        risk = "Moderate";
      } else {
        risk = "Low";
      }

      // Create detailed description for display
      let detailedRisk = "";
      if (score >= 60) {
        detailedRisk = `Very HIGH RISK of having diabetes: Oral Glucose Tolerance Test (OGTT) is recommended to rule out diabetes. If this is not possible, at least a random blood sugar or a fasting blood sugar should be done.`;
      } else if (score >= 30 && score <= 50) {
        detailedRisk = "The risk of having diabetes is MODERATE: It is still recommended to have the above check up.";
      } else {
        detailedRisk = "Risk of having diabetes is probably LOW.";
      }

      const dataToSend = {
        user: formData.user,
        ageScore: formData.ageScore,
        waistScore: formData.waistScore,
        physicalActivityScore: formData.physicalActivityScore,
        familyHistoryScore: formData.familyHistoryScore,
        totalScore: score,
        riskLevel: risk,
      };

      setFormData({
        ...formData,
        totalScore: score,
        riskLevel: detailedRisk,
      });

      // Get auth token from localStorage
      const token = localStorage.getItem('authtoken');
      
      const res = await axios.post(`${BACKEND_URL}/diabetic/create`, dataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Diabetic risk assessment created successfully:", res.data.message);
      
      if (onCalculateDiabeticRisk && typeof onCalculateDiabeticRisk === 'function') {
        setTimeout(() => {
          const data = res.data.data;
          onCalculateDiabeticRisk(
            data._id,
            data.totalScore,
            data.riskLevel,
            data.createdAt
          );
        }, 3000);
      }
    } catch (err) {
      console.error('Error creating diabetic risk assessment:', err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="p-5 max-w-4xl mx-auto flex flex-col">
      <div className="mb-5">
        <label className="block font-medium text-gray-900 mb-2">Age</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="age"
              value={0}
              checked={formData.ageScore === 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ageScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            {"<35 Years"}
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="age"
              value={20}
              checked={formData.ageScore === 20}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ageScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            35 to 49 Years
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="age"
              value={30}
              checked={formData.ageScore === 30}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ageScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            ≥ 50 Years
          </label>
        </div>
      </div>

      <div className="mb-5">
        <label className="block font-medium text-gray-900 mb-2">Waist circumference</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="waist"
              value={0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  waistScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            {"Waist < 80 cm [female]; < 90 cm [male]"}
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="waist"
              value={10}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  waistScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            Waist 80 - 89 cm [female], 90 – 99 cm [male]
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="waist"
              value={20}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  waistScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            Waist ≥ 90 cm [female], ≥ 100 cm [male]
          </label>
        </div>
      </div>

      <div className="mb-5">
        <label className="block font-medium text-gray-900 mb-2">Physical activity</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="physical-activity"
              value={0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  physicalActivityScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            Vigorous exercise [regular] or strenuous [manual] work at home / work
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="physical-activity"
              value={10}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  physicalActivityScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            Moderate exercise [regular] or moderate physical activity at home / work
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="physical-activity"
              value={20}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  physicalActivityScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            Mild exercise [regular] or mild physical activity at home / work
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="physical-activity"
              value={30}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  physicalActivityScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            No exercise and sedentary activities at home / work
          </label>
        </div>
      </div>

      <div className="mb-5">
        <label className="block font-medium text-gray-900 mb-2">Family history of diabetes</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="family-history"
              value={0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  familyHistoryScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            No diabetes in parents
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="family-history"
              value={10}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  familyHistoryScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            One parent is diabetic
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="family-history"
              value={20}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  familyHistoryScore: +e.target.value,
                })
              }
              className="mr-2"
            />
            Both parents are diabetic
          </label>
        </div>
      </div>

      <button
        onClick={calculateRisk}
        className="bg-blue-600 text-white px-4 py-2 rounded w-48"
      >
        Calculate Risk
      </button>

      {formData.riskLevel && (
        <>
          <div className="mt-5">
            <h3 className="text-lg font-semibold">
              Total Score: {formData.totalScore}
            </h3>
            <p className="text-base">{formData.riskLevel}</p>
          </div>
          <div className="mt-5">
            <h3 className="text-lg font-semibold">Notes:</h3>
            <ul className="ml-5 flex flex-col gap-5">
              <li>
                <strong>≥ 60</strong>: Very{" "}
                <span className="text-red-600 font-bold">HIGH RISK</span>{" "}
                of having diabetes: Oral Glucose Tolerance Test (OGTT) is
                recommended to rule out diabetes. If this is not possible, at
                least a random blood sugar or a fasting blood sugar should be
                done.
              </li>
              <li>
                <strong>30 – 50</strong>: The risk of having diabetes is
                <span className="text-yellow-600 font-bold"> MODERATE</span>{" "}
                It is still recommended to have the above check-up.
              </li>
              <li>
                <strong>&lt;30</strong>: Risk of having diabetes is probably
                <span className="text-green-600 font-bold"> LOW</span>{" "}
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default DiabeticRiskCalculator;
