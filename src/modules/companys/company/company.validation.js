import joi from "joi";
import { generalFields } from "../../../middleware/validation/generalFields.js";

export const companyValidation = {
  createCompany: {
    body: joi
      .object({
        CompanyName: joi.string().min(2).max(50).required(),
        ContactEmail: joi.string().email().required(),
        Industry: joi.string().required(),
        OrganizationSize: joi.string().required(),
        OrganizationType: joi.string().required(),
        Website: joi.string().uri().optional(),
        Location: joi.string().required(),
        Description: joi.string().min(10).max(1000).required(),
      })
      .required(),
  },

  updateCompany: {
    params: joi.object({ companyId: generalFields.id.required() }),
    body: joi
      .object({
        CompanyName: joi.string().min(2).max(50).optional(),
        Industry: joi.string().optional(),
        OrganizationSize: joi.string().optional(),
        OrganizationType: joi.string().optional(),
        Website: joi.string().uri().optional(),
        Location: joi.string().optional(),
        Description: joi.string().min(10).max(1000).optional(),
      })
      .min(1),
  },

  deleteCompany: {
    params: joi.object({ companyId: generalFields.id.required(), }).required(),
  },

  companyIdParam: {
    params: joi.object({ companyId: generalFields.id.required() }),
  },

  addAdmin: {
    params: joi.object({ companyId: generalFields.id.required() }),
    body: joi
      .object({
        newUserEmail: joi.string().email().required(),
        role: joi.string().valid("admin", "superAdmin").optional(),
      })
      .required(),
  },

  addEmployee: {
    params: joi.object({ companyId: generalFields.id.required() }),
    body: joi
      .object({
        employeeId: generalFields.id.required(),
      })
      .required(),
  },

  getCompanies: {
    query: joi.object({
      page: joi.number().integer().min(1).optional(),
      limit: joi.number().integer().min(1).max(50).optional(),
    }),
  },
};
