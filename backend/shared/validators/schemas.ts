import Joi from 'joi';

/**
 * Validation schemas using Joi
 */

// Upload Asset validation
export const uploadAssetSchema = Joi.object({
  file: Joi.object().required(),
  model: Joi.string().optional().max(50),
  year: Joi.string().optional().pattern(/^\d{4}$/),
  category: Joi.string().optional().max(100),
});

// Product Search validation
export const productSearchSchema = Joi.object({
  query: Joi.string().required().min(1).max(500),
  model: Joi.string().optional().max(50),
  year: Joi.string().optional().pattern(/^\d{4}$/),
  category: Joi.string().optional().max(100),
});

// Asset ID validation
export const assetIdSchema = Joi.string()
  .uuid()
  .required();

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
});

// Date range validation
export const dateRangeSchema = Joi.object({
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
});

/**
 * Validate data against a schema
 */
export function validate<T>(schema: Joi.Schema, data: any): { value?: T; error?: string } {
  const result = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (result.error) {
    const errorMessage = result.error.details
      .map((detail) => detail.message)
      .join(', ');

    return { error: errorMessage };
  }

  return { value: result.value as T };
}

export default {
  uploadAssetSchema,
  productSearchSchema,
  assetIdSchema,
  paginationSchema,
  dateRangeSchema,
  validate,
};
