import { useState, useEffect } from "react";
//  import { useParams } from "react-router";
import { BACKEND_URL } from "../../utils/urlConstants";
import axios from "axios";

const CoronaryHeartDiseaseRiskCalculator = ({
  onCalculateCoronaryRisk = null,
  latestEmrData = {},
  userId
}) => {
//   const { employeeId, individualUserId } = useParams();
// const userId = "687eab0a72d7830b9fd47f40"
  const [formData, setFormData] = useState({
    gender: latestEmrData?.gender ? (latestEmrData?.gender === 'M' || latestEmrData?.gender?.toLowerCase() === 'male' ? 'M' : 'F') : 'M',
    race: 1,
    age: latestEmrData?.age,
    systolicBP: 0,
    onHypertensionMed: false,
    diabetes: latestEmrData?.isDiabetic ?? false,
    smoker: latestEmrData?.isSmoke ?? false,
    totalCholesterol: 0,
    hdlCholesterol: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [riskPercentage, setRiskPercentage] = useState(0);

  useEffect(() => {
    setIsLoading(true);

    // Get auth token from localStorage
    const token = localStorage.getItem('authtoken');

    axios.post(`${BACKEND_URL}/coronary/get-all`, {
      user: userId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        setFormData(currentFormData => ({
          ...currentFormData,
          age: res.data.age,
          gender: res.data.gender,
          totalCholesterol: res.data.totalCholesterol,
          hdlCholesterol: res.data.hdlCholesterol,
          systolicBP: res.data.systolicBP,
        }));
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [userId]);

  const handleCoronaryDieasesCalculate = () => {
    setIsLoading(true);

    // Get auth token from localStorage
    const token = localStorage.getItem('authtoken');
    
    axios.post(`${BACKEND_URL}/coronary/create`, {
      patientData: formData,
      user: userId,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        setRiskPercentage(res.data.riskPercentage);
        setIsLoading(false);
        
        // Call the callback function if provided
        if (onCalculateCoronaryRisk && typeof onCalculateCoronaryRisk === 'function') {
          setTimeout(() => {
            onCalculateCoronaryRisk(
              res.data._id,
              res.data.riskPercentage,
              res.data.createdAt
            );
          }, 3000);
        }
      })
      .catch((err) => {
        console.error('Error calculating coronary risk:', err);
        setIsLoading(false);
      });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 items-center justify-center h-[60vh]">
        
        <h2 className="text-xl font-semibold">Loading</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-8">
      <h2 className="text-xl font-semibold mb-6">Framingham Calculator</h2>
      
      <div className="space-y-6">
        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age (years)
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) =>
              setFormData({ ...formData, age: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Race */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Race
          </label>
          <select
            value={formData.race}
            onChange={(e) =>
              setFormData({ ...formData, race: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={0}>White</option>
            <option value={1}>Asian</option>
          </select>
        </div>

        {/* Systolic BP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Systolic Blood Pressure (mmHg)
          </label>
          <input
            type="number"
            value={formData.systolicBP}
            onChange={(e) =>
              setFormData({ ...formData, systolicBP: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Hypertension Medication */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="hypertensionMed"
            checked={formData.onHypertensionMed}
            onChange={(e) =>
              setFormData({
                ...formData,
                onHypertensionMed: e.target.checked,
              })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="hypertensionMed" className="ml-2 text-sm text-gray-700">
            On Hypertension Medication
          </label>
        </div>

        {/* Diabetes */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="diabetes"
            checked={formData.diabetes}
            onChange={(e) =>
              setFormData({
                ...formData,
                diabetes: e.target.checked,
              })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="diabetes" className="ml-2 text-sm text-gray-700">
            Diabetes
          </label>
        </div>

        {/* Smoker */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="smoker"
            checked={formData.smoker}
            onChange={(e) =>
              setFormData({
                ...formData,
                smoker: e.target.checked,
              })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="smoker" className="ml-2 text-sm text-gray-700">
            Smoker
          </label>
        </div>

        {/* Total Cholesterol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Cholesterol (mg/dL)
          </label>
          <input
            type="number"
            value={formData.totalCholesterol}
            onChange={(e) =>
              setFormData({
                ...formData,
                totalCholesterol: parseInt(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* HDL Cholesterol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HDL Cholesterol (mg/dL)
          </label>
          <input
            type="number"
            value={formData.hdlCholesterol}
            onChange={(e) =>
              setFormData({
                ...formData,
                hdlCholesterol: parseInt(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Calculate Button and Results */}
      <div className="mt-8">
        <button
          onClick={handleCoronaryDieasesCalculate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 mb-6"
        >
          Calculate Now!
        </button>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <p className="text-gray-700">
            10-year risk of heart disease: {riskPercentage}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoronaryHeartDiseaseRiskCalculator;
