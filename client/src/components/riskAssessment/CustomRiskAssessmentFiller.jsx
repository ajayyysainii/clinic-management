import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Calculator, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  User,
  FileText,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';

const CustomRiskAssessmentFiller = ({ form, patientId, onClose, onSubmitted }) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calculatedScore, setCalculatedScore] = useState(null);
  const [riskLevel, setRiskLevel] = useState(null);

  useEffect(() => {
    // Initialize form data with default values
    const initialData = {};
    form.fields.forEach(field => {
      if (field.defaultValue !== undefined && field.defaultValue !== '') {
        initialData[field.name] = field.defaultValue;
      } else {
        // Set appropriate default values based on field type
        switch (field.type) {
          case 'checkbox':
            initialData[field.name] = [];
            break;
          case 'boolean':
            initialData[field.name] = false;
            break;
          case 'number':
            initialData[field.name] = field.min || 0;
            break;
          default:
            initialData[field.name] = '';
        }
      }
    });
    setFormData(initialData);
  }, [form]);

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    form.fields.forEach(field => {
      if (field.isRequired) {
        const value = formData[field.name];
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          errors.push(`${field.label} is required`);
        }
      }
    });

    return errors;
  };

  const calculateScore = (formula, responses) => {
    try {
      // Create a context object with field values
      const context = {};
      responses.forEach(response => {
        context[response.fieldName] = parseFloat(response.value) || 0;
      });

      // Replace field names with their values in the formula
      let evaluatedFormula = formula;
      Object.keys(context).forEach(fieldName => {
        const regex = new RegExp(`\\b${fieldName}\\b`, 'g');
        evaluatedFormula = evaluatedFormula.replace(regex, context[fieldName]);
      });

      return evaluateArithmeticExpression(evaluatedFormula);
    } catch (error) {
      console.error('Error calculating score:', error);
      return null;
    }
  };

  const determineRiskLevel = (score, riskLevels) => {
    if (score >= riskLevels.high.min) {
      return 'high';
    } else if (score >= riskLevels.moderate.min) {
      return 'moderate';
    } else {
      return 'low';
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    if (!patientId) {
      setError('Patient ID is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Prepare responses array
      const responses = Object.entries(formData).map(([fieldName, value]) => ({
        fieldName,
        value: Array.isArray(value) ? value.join(', ') : value
      }));

      // Calculate score if scoring logic exists
      let score = null;
      let level = null;

      if (form.scoringLogic?.formula) {
        score = calculateScore(form.scoringLogic.formula, responses);
        if (score !== null) {
          level = determineRiskLevel(score, form.scoringLogic.riskLevels);
          setCalculatedScore(score);
          setRiskLevel(level);
        }
      }

      const token = localStorage.getItem('authtoken');
      
      // Debug logging
      console.log('Submitting form data:', {
        formId: form._id,
        patientId,
        responses,
        notes: ''
      });
      
      const response = await axios.post(`${BACKEND_URL}/custom-risk-assessment/${form._id}/submit`, {
        patientId,
        responses,
        notes: ''
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Risk assessment submitted successfully!');
      
      if (onSubmitted) {
        onSubmitted(response.data.data);
      }

      // Reset form after successful submission
      setTimeout(() => {
        setSuccess('');
        if (onClose) {
          onClose();
        }
      }, 2000);

    } catch (error) {
      console.error('Error submitting risk assessment:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.isRequired}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.isRequired}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.isRequired}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.isRequired}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.isRequired}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.isRequired}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.isRequired}
          >
            <option value="">Select an option</option>
            {field.options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <label key={index} className="flex items-center gap-3">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  required={field.isRequired}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <label key={index} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const newValue = Array.isArray(value) ? [...value] : [];
                    if (e.target.checked) {
                      newValue.push(option);
                    } else {
                      const index = newValue.indexOf(option);
                      if (index > -1) {
                        newValue.splice(index, 1);
                      }
                    }
                    handleInputChange(field.name, newValue);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name={field.name}
                value="true"
                checked={value === true}
                onChange={() => handleInputChange(field.name, true)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                required={field.isRequired}
              />
              <span className="text-gray-700">Yes</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                name={field.name}
                value="false"
                checked={value === false}
                onChange={() => handleInputChange(field.name, false)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                required={field.isRequired}
              />
              <span className="text-gray-700">No</span>
            </label>
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="range"
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              min={field.min}
              max={field.max}
              step={field.step}
              className="w-full"
              required={field.isRequired}
            />
            <div className="text-sm text-gray-500">
              Value: {value} {field.min && field.max && `(${field.min} - ${field.max})`}
            </div>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.isRequired}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{form.name}</h1>
              {form.description && (
                <p className="text-purple-100">{form.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                {success}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-6">
              {form.fields.map((field, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="mb-4">
                    <label className="block text-lg font-semibold text-gray-900 mb-2">
                      {field.label}
                      {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.placeholder && (
                      <p className="text-sm text-gray-600 mb-3">{field.placeholder}</p>
                    )}
                  </div>
                  {renderField(field)}
                </div>
              ))}
            </div>

            {/* Scoring Results */}
            {calculatedScore !== null && (
              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calculator className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Assessment Results</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600">Calculated Score</div>
                    <div className="text-2xl font-bold text-blue-600">{calculatedScore}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600">Risk Level</div>
                    <div className={`text-2xl font-bold capitalize ${
                      riskLevel === 'high' ? 'text-red-600' :
                      riskLevel === 'moderate' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {riskLevel}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Submit Assessment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomRiskAssessmentFiller;
const evaluateArithmeticExpression = (expression) => {
  if (!/^[\d+\-*/%().\seE]+$/.test(expression)) {
    throw new Error('Formula contains unsupported characters');
  }

  const tokens = expression.match(/\d*\.?\d+(?:e[+-]?\d+)?|[()+\-*/%]/gi) || [];
  const output = [];
  const operators = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, 'u-': 3 };
  const rightAssociative = new Set(['u-']);
  let previousType = 'start';

  tokens.forEach((token) => {
    if (!Number.isNaN(Number(token))) {
      output.push(Number(token));
      previousType = 'number';
      return;
    }

    if (token === '(') {
      operators.push(token);
      previousType = 'open';
      return;
    }

    if (token === ')') {
      while (operators.length && operators.at(-1) !== '(') output.push(operators.pop());
      if (operators.pop() !== '(') throw new Error('Formula has mismatched parentheses');
      previousType = 'number';
      return;
    }

    const operator = token === '-' && ['start', 'operator', 'open'].includes(previousType) ? 'u-' : token;
    while (
      operators.length &&
      operators.at(-1) !== '(' &&
      (precedence[operators.at(-1)] > precedence[operator] ||
        (precedence[operators.at(-1)] === precedence[operator] && !rightAssociative.has(operator)))
    ) {
      output.push(operators.pop());
    }
    operators.push(operator);
    previousType = 'operator';
  });

  while (operators.length) {
    const operator = operators.pop();
    if (operator === '(') throw new Error('Formula has mismatched parentheses');
    output.push(operator);
  }

  const values = [];
  output.forEach((token) => {
    if (typeof token === 'number') {
      values.push(token);
      return;
    }
    if (token === 'u-') {
      if (!values.length) throw new Error('Invalid formula');
      values.push(-values.pop());
      return;
    }
    const right = values.pop();
    const left = values.pop();
    if (left === undefined || right === undefined) throw new Error('Invalid formula');
    const operations = {
      '+': () => left + right,
      '-': () => left - right,
      '*': () => left * right,
      '/': () => left / right,
      '%': () => left % right,
    };
    values.push(operations[token]());
  });

  if (values.length !== 1 || !Number.isFinite(values[0])) throw new Error('Formula did not produce a finite number');
  return values[0];
};
