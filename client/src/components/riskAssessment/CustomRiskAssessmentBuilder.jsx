import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Edit3, 
  Copy, 
  Settings, 
  Calculator,
  FileText,
  Type,
  Hash,
  Mail,
  Link,
  Calendar,
  List,
  ToggleLeft,
  CheckSquare,
  Minus,
  Move,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/urlConstants';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: Type },
  { value: 'textarea', label: 'Text Area', icon: FileText },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'url', label: 'URL', icon: Link },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'radio', label: 'Radio Buttons', icon: ToggleLeft },
  { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { value: 'boolean', label: 'Yes/No', icon: ToggleLeft },
  { value: 'range', label: 'Range Slider', icon: Minus }
];

const CustomRiskAssessmentBuilder = ({ onFormCreated, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [],
    scoringLogic: {
      formula: '',
      riskLevels: {
        low: { min: 0, max: 30 },
        moderate: { min: 31, max: 60 },
        high: { min: 61, max: 100 }
      }
    }
  });

  const [currentField, setCurrentField] = useState({
    name: '',
    label: '',
    type: 'text',
    isRequired: false,
    defaultValue: '',
    placeholder: '',
    min: '',
    max: '',
    step: '',
    options: [''],
    validation: {
      min: '',
      max: '',
      pattern: '',
      message: ''
    },
    order: 0
  });

  const [showScoringLogic, setShowScoringLogic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addField = () => {
    if (!currentField.name || !currentField.label) {
      setError('Field name and label are required');
      return;
    }

    const newField = {
      ...currentField,
      order: formData.fields.length + 1
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));

    // Reset current field
    setCurrentField({
      name: '',
      label: '',
      type: 'text',
      isRequired: false,
      defaultValue: '',
      placeholder: '',
      min: '',
      max: '',
      step: '',
      options: [''],
      validation: {
        min: '',
        max: '',
        pattern: '',
        message: ''
      },
      order: 0
    });

    setError('');
  };

  const removeField = (index) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const moveField = (index, direction) => {
    const newFields = [...formData.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      
      // Update order
      newFields.forEach((field, i) => {
        field.order = i + 1;
      });
      
      setFormData(prev => ({
        ...prev,
        fields: newFields
      }));
    }
  };

  const addOption = (fieldIndex) => {
    const newFields = [...formData.fields];
    newFields[fieldIndex].options.push('');
    setFormData(prev => ({
      ...prev,
      fields: newFields
    }));
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const newFields = [...formData.fields];
    newFields[fieldIndex].options.splice(optionIndex, 1);
    setFormData(prev => ({
      ...prev,
      fields: newFields
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Form name is required');
      return;
    }

    if (formData.fields.length === 0) {
      setError('At least one field is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('authtoken');
      const response = await axios.post(`${BACKEND_URL}/custom-risk-assessment/create`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Custom risk assessment form created successfully!');
      
      if (onFormCreated) {
        onFormCreated(response.data.data);
      }

      // Reset form after successful creation
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          fields: [],
          scoringLogic: {
            formula: '',
            riskLevels: {
              low: { min: 0, max: 30 },
              moderate: { min: 31, max: 60 },
              high: { min: 61, max: 100 }
            }
          }
        });
        setSuccess('');
      }, 2000);

    } catch (error) {
      console.error('Error creating custom risk assessment form:', error);
      setError(error.response?.data?.message || 'Failed to create form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldInputs = () => {
    const { type } = currentField;

    return (
      <div className="space-y-4">
        {/* Basic field properties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name *
            </label>
            <input
              type="text"
              value={currentField.name}
              onChange={(e) => setCurrentField(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., age, blood_pressure"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label *
            </label>
            <input
              type="text"
              value={currentField.label}
              onChange={(e) => setCurrentField(prev => ({ ...prev, label: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Age, Blood Pressure"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type *
            </label>
            <select
              value={currentField.type}
              onChange={(e) => setCurrentField(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FIELD_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Value
            </label>
            <input
              type="text"
              value={currentField.defaultValue}
              onChange={(e) => setCurrentField(prev => ({ ...prev, defaultValue: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Default value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={currentField.placeholder}
              onChange={(e) => setCurrentField(prev => ({ ...prev, placeholder: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Placeholder text"
            />
          </div>
        </div>

        {/* Field-specific properties */}
        {(type === 'number' || type === 'range') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
              <input
                type="number"
                value={currentField.min}
                onChange={(e) => setCurrentField(prev => ({ ...prev, min: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
              <input
                type="number"
                value={currentField.max}
                onChange={(e) => setCurrentField(prev => ({ ...prev, max: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Step</label>
              <input
                type="number"
                value={currentField.step}
                onChange={(e) => setCurrentField(prev => ({ ...prev, step: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Options for select, radio, checkbox */}
        {(type === 'select' || type === 'radio' || type === 'checkbox') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              {currentField.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...currentField.options];
                      newOptions[index] = e.target.value;
                      setCurrentField(prev => ({ ...prev, options: newOptions }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${index + 1}`}
                  />
                  {currentField.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(0, index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(0)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </button>
            </div>
          </div>
        )}

        {/* Required field checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isRequired"
            checked={currentField.isRequired}
            onChange={(e) => setCurrentField(prev => ({ ...prev, isRequired: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isRequired" className="ml-2 text-sm text-gray-700">
            This field is required
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Custom Risk Assessment Builder</h1>
              <p className="text-blue-100">Create your own risk assessment forms with dynamic fields and scoring logic</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
              >
                Cancel
              </button>
            </div>
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
                <CheckSquare className="h-5 w-5" />
                {success}
              </div>
            </div>
          )}

          {/* Form Details */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Form Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Cardiovascular Risk Assessment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this assessment"
                />
              </div>
            </div>
          </div>

          {/* Field Builder */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Form Fields</h2>
              <button
                onClick={addField}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </button>
            </div>

            {/* Current Field Builder */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Field</h3>
              {renderFieldInputs()}
            </div>

            {/* Existing Fields */}
            {formData.fields.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Fields ({formData.fields.length})</h3>
                <div className="space-y-3">
                  {formData.fields.map((field, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Move className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{field.label}</div>
                            <div className="text-sm text-gray-500">
                              {field.name} • {field.type} {field.isRequired && '• Required'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {index > 0 && (
                            <button
                              onClick={() => moveField(index, 'up')}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              ↑
                            </button>
                          )}
                          {index < formData.fields.length - 1 && (
                            <button
                              onClick={() => moveField(index, 'down')}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              ↓
                            </button>
                          )}
                          <button
                            onClick={() => removeField(index)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scoring Logic */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Scoring Logic</h2>
              <button
                onClick={() => setShowScoringLogic(!showScoringLogic)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Calculator className="h-4 w-4" />
                {showScoringLogic ? 'Hide' : 'Show'} Scoring Logic
              </button>
            </div>

            {showScoringLogic && (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scoring Formula
                    </label>
                    <textarea
                      value={formData.scoringLogic.formula}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        scoringLogic: { ...prev.scoringLogic, formula: e.target.value }
                      }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., age + blood_pressure * 0.5 + (diabetes ? 20 : 0)"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Use field names as variables. Example: age, blood_pressure, diabetes
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Level Thresholds
                    </label>
                    <div className="space-y-3">
                      {Object.entries(formData.scoringLogic.riskLevels).map(([level, range]) => (
                        <div key={level} className="flex items-center gap-3">
                          <span className="w-16 text-sm font-medium text-gray-700 capitalize">{level}:</span>
                          <input
                            type="number"
                            value={range.min}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              scoringLogic: {
                                ...prev.scoringLogic,
                                riskLevels: {
                                  ...prev.scoringLogic.riskLevels,
                                  [level]: { ...range, min: parseInt(e.target.value) || 0 }
                                }
                              }
                            }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <input
                            type="number"
                            value={range.max}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              scoringLogic: {
                                ...prev.scoringLogic,
                                riskLevels: {
                                  ...prev.scoringLogic.riskLevels,
                                  [level]: { ...range, max: parseInt(e.target.value) || 0 }
                                }
                              }
                            }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Form
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomRiskAssessmentBuilder; 