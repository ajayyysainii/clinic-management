import { Request, Response as ExpressResponse } from 'express';
import AuthenticatedRequest from '../../../types/AuthenticatedRequest';
import CustomRiskAssessment from '../models/customRiskAssessment.model';
import CustomRiskAssessmentResponse from '../models/customRiskAssessmentResponse.model';
import Response  from '../../../utils/Response';
import  AppConstant  from '../../../utils/AppConstants';

export class CustomRiskAssessmentController {
  // Create a new custom risk assessment form
  createForm = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
    try {
      const { name, description, fields, scoringLogic } = req.body;
      const createdBy = req.currentUser?._id;
      const clinic = req.currentUser?.clinic;

      if (!createdBy || !clinic) {
        Response.error(res, 400, AppConstant.FAILED, "User or clinic information is required");
        return;
      }

      // Validate required fields
      if (!name || !fields || !Array.isArray(fields) || fields.length === 0) {
        Response.error(res, 400, AppConstant.FAILED, "Form name and fields are required");
        return;
      }

      // Validate field structure
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (!field.name || !field.label || !field.type) {
          Response.error(res, 400, AppConstant.FAILED, `Field ${i + 1} is missing required properties`);
          return;
        }
        field.order = i + 1; // Set order automatically
      }

      const form = new CustomRiskAssessment({
        name,
        description,
        createdBy,
        clinic,
        fields,
        scoringLogic
      });

      const savedForm = await form.save();

      Response.success(
        res,
        savedForm,
        201,
        "Custom risk assessment form created successfully",
        AppConstant.SUCCESS
      );
    } catch (error: any) {
      console.error('Error creating custom risk assessment form:', error);
      Response.error(res, 500, AppConstant.FAILED, error.message || "Internal server error");
    }
  };

  // Get all forms for a clinic
  getAllForms = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
    try {
      const clinic = req.currentUser?.clinic;

      if (!clinic) {
        Response.error(res, 400, AppConstant.FAILED, "Clinic information is required");
        return;
      }

      const forms = await CustomRiskAssessment.find({ clinic, isActive: true })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      Response.success(
        res,
        forms,
        200,
        "Custom risk assessment forms retrieved successfully",
        AppConstant.SUCCESS
      );
    } catch (error: any) {
      console.error('Error fetching custom risk assessment forms:', error);
      Response.error(res, 500, AppConstant.FAILED, error.message || "Internal server error");
    }
  };

  // Get a specific form by ID
  getFormById = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
    try {
      const { formId } = req.params;
      const clinic = req.currentUser?.clinic;

      if (!clinic) {
        Response.error(res, 400, AppConstant.FAILED, "Clinic information is required");
        return;
      }

      const form = await CustomRiskAssessment.findOne({ _id: formId, clinic, isActive: true })
        .populate('createdBy', 'name email');

      if (!form) {
        Response.error(res, 404, AppConstant.FAILED, "Form not found");
        return;
      }

      Response.success(
        res,
        form,
        200,
        "Custom risk assessment form retrieved successfully",
        AppConstant.SUCCESS
      );
    } catch (error: any) {
      console.error('Error fetching custom risk assessment form:', error);
      Response.error(res, 500, AppConstant.FAILED, error.message || "Internal server error");
    }
  };

  // Update a form
  updateForm = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
    try {
      const { formId } = req.params;
      const { name, description, fields, scoringLogic, isActive } = req.body;
      const clinic = req.currentUser?.clinic;

      if (!clinic) {
        Response.error(res, 400, AppConstant.FAILED, "Clinic information is required");
        return;
      }

      const form = await CustomRiskAssessment.findOne({ _id: formId, clinic });

      if (!form) {
        Response.error(res, 404, AppConstant.FAILED, "Form not found");
        return;
      }

      // Update fields if provided
      if (fields && Array.isArray(fields)) {
        for (let i = 0; i < fields.length; i++) {
          const field = fields[i];
          if (!field.name || !field.label || !field.type) {
            Response.error(res, 400, AppConstant.FAILED, `Field ${i + 1} is missing required properties`);
            return;
          }
          field.order = i + 1;
        }
      }

      const updatedForm = await CustomRiskAssessment.findByIdAndUpdate(
        formId,
        {
          name,
          description,
          fields,
          scoringLogic,
          isActive
        },
        { new: true }
      ).populate('createdBy', 'name email');

      Response.success(
        res,
        updatedForm,
        200,
        "Custom risk assessment form updated successfully",
        AppConstant.SUCCESS
      );
    } catch (error: any) {
      console.error('Error updating custom risk assessment form:', error);
      Response.error(res, 500, AppConstant.FAILED, error.message || "Internal server error");
    }
  };

  // Delete a form (soft delete)
  deleteForm = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
    try {
      const { formId } = req.params;
      const clinic = req.currentUser?.clinic;

      if (!clinic) {
        Response.error(res, 400, AppConstant.FAILED, "Clinic information is required");
        return;
      }

      const form = await CustomRiskAssessment.findOne({ _id: formId, clinic });

      if (!form) {
        Response.error(res, 404, AppConstant.FAILED, "Form not found");
        return;
      }

      // Soft delete by setting isActive to false
      await CustomRiskAssessment.findByIdAndUpdate(formId, { isActive: false });

      Response.success(
        res,
        null,
        200,
        "Custom risk assessment form deleted successfully",
        AppConstant.SUCCESS
      );
    } catch (error: any) {
      console.error('Error deleting custom risk assessment form:', error);
      Response.error(res, 500, AppConstant.FAILED, error.message || "Internal server error");
    }
  };

  // Submit a response to a custom form
  submitResponse = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
    try {
      const { formId } = req.params;
      const { patientId, responses, notes } = req.body;
      const doctorId = req.currentUser?._id;
      const clinic = req.currentUser?.clinic;

      if (!doctorId || !clinic) {
        Response.error(res, 400, AppConstant.FAILED, "User or clinic information is required");
        return;
      }

      if (!patientId || !responses || !Array.isArray(responses)) {
        Response.error(res, 400, AppConstant.FAILED, "Patient ID and responses are required");
        return;
      }

      // Get the form to validate responses
      const form = await CustomRiskAssessment.findOne({ _id: formId, clinic, isActive: true });

      if (!form) {
        Response.error(res, 404, AppConstant.FAILED, "Form not found");
        return;
      }

      // Validate that all required fields are provided
      const requiredFields = form.fields.filter(field => field.isRequired);
      const providedFields = responses.map(r => r.fieldName);

      for (const requiredField of requiredFields) {
        if (!providedFields.includes(requiredField.name)) {
          Response.error(res, 400, AppConstant.FAILED, `Required field '${requiredField.label}' is missing`);
          return;
        }
      }

      // Calculate score if scoring logic exists
      let calculatedScore: number | undefined;
      let riskLevel: string | undefined;

      if (form.scoringLogic?.formula) {
        try {
          calculatedScore = this.calculateScore(form.scoringLogic.formula, responses);
          riskLevel = this.determineRiskLevel(calculatedScore, form.scoringLogic.riskLevels);
        } catch (error) {
          console.error('Error calculating score:', error);
          // Continue without score calculation
        }
      }

      const response = new CustomRiskAssessmentResponse({
        formId,
        patientId,
        doctorId,
        clinic,
        responses,
        calculatedScore,
        riskLevel,
        notes
      });

      const savedResponse = await response.save();

      Response.success(
        res,
        savedResponse,
        201,
        "Risk assessment response submitted successfully",
        AppConstant.SUCCESS
      );
    } catch (error: any) {
      console.error('Error submitting risk assessment response:', error);
      Response.error(res, 500, AppConstant.FAILED, error.message || "Internal server error");
    }
  };

  // Get responses for a specific form
  getFormResponses = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
    try {
      const { formId } = req.params;
      const clinic = req.currentUser?.clinic;

      if (!clinic) {
        Response.error(res, 400, AppConstant.FAILED, "Clinic information is required");
        return;
      }

      const responses = await CustomRiskAssessmentResponse.find({ formId, clinic })
        .populate('patientId', 'name email')
        .populate('doctorId', 'name email')
        .sort({ createdAt: -1 });

      Response.success(
        res,
        responses,
        200,
        "Form responses retrieved successfully",
        AppConstant.SUCCESS
      );
    } catch (error: any) {
      console.error('Error fetching form responses:', error);
      Response.error(res, 500, AppConstant.FAILED, error.message || "Internal server error");
    }
  };

  // Get custom form responses for a specific patient
  getPatientCustomFormResponses = async (req: AuthenticatedRequest, res: ExpressResponse): Promise<void> => {
    try {
      const { patientId } = req.params;
      const clinic = req.currentUser?.clinic;

      if (!clinic) {
        Response.error(res, 400, AppConstant.FAILED, "Clinic information is required");
        return;
      }

      const responses = await CustomRiskAssessmentResponse.find({ patientId, clinic })
        .populate('formId', 'name description')
        .populate('doctorId', 'name email')
        .sort({ createdAt: -1 });

      Response.success(
        res,
        responses,
        200,
        "Patient custom form responses retrieved successfully",
        AppConstant.SUCCESS
      );
    } catch (error: any) {
      console.error('Error fetching patient custom form responses:', error);
      Response.error(res, 500, AppConstant.FAILED, error.message || "Internal server error");
    }
  };

  // Helper method to calculate score based on formula
  private calculateScore(formula: string, responses: any[]): number {
    // Create a context object with field values
    const context: any = {};
    responses.forEach(response => {
      context[response.fieldName] = parseFloat(response.value) || 0;
    });

    // Simple formula evaluation (you might want to use a more robust library)
    try {
      // Replace field names with their values in the formula
      let evaluatedFormula = formula;
      Object.keys(context).forEach(fieldName => {
        const regex = new RegExp(`\\b${fieldName}\\b`, 'g');
        evaluatedFormula = evaluatedFormula.replace(regex, context[fieldName]);
      });

      // Evaluate the formula (basic implementation)
      // In production, you might want to use a safer evaluation method
      return eval(evaluatedFormula);
    } catch (error) {
      throw new Error('Invalid scoring formula');
    }
  }

  // Helper method to determine risk level
  private determineRiskLevel(score: number, riskLevels: any): string {
    if (score >= riskLevels.high.min) {
      return 'high';
    } else if (score >= riskLevels.moderate.min) {
      return 'moderate';
    } else {
      return 'low';
    }
  }
}

export default new CustomRiskAssessmentController();
