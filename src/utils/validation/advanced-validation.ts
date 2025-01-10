import { z } from 'zod';
import { CandidateStatus } from '../../types';

// Advanced validation rules for various data types
const addressSchema = z.object({
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().length(2, 'State must be a 2-letter code'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
});

const personalInfoSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email format')
    .refine(email => {
      const [localPart, domain] = email.split('@');
      return localPart.length <= 64 && domain.length <= 255;
    }, 'Email length exceeds maximum allowed'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .refine(phone => phone.replace(/\D/g, '').length >= 10, 'Phone number must have at least 10 digits'),
  address: addressSchema,
});

const experienceSchema = z.array(z.object({
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  title: z.string().min(2, 'Job title must be at least 2 characters'),
  startDate: z.date(),
  endDate: z.date().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
})).refine((experiences) => {
  return experiences.every((exp) => !exp.endDate || exp.endDate > exp.startDate);
}, 'End date must be after start date');

const educationSchema = z.array(z.object({
  institution: z.string().min(2, 'Institution name must be at least 2 characters'),
  degree: z.string().min(2, 'Degree must be at least 2 characters'),
  field: z.string().min(2, 'Field of study must be at least 2 characters'),
  graduationDate: z.date(),
  gpa: z.number().min(0).max(4).optional(),
}));

const skillsSchema = z.array(z.string())
  .min(1, 'At least one skill is required')
  .refine(skills => new Set(skills).size === skills.length, 'Duplicate skills are not allowed');

const employmentInfoSchema = z.object({
  status: z.nativeEnum(CandidateStatus),
  department: z.string(),
  position: z.string(),
  salary: z.object({
    amount: z.number(),
    currency: z.string()
  })
});

const communicationInfoSchema = z.object({
  preferredMethod: z.enum(['email', 'phone', 'sms']),
  availableTimeSlots: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    endTime: z.string()
  })),
  timezone: z.string()
});

const validationSchemas = {
  personalInfo: personalInfoSchema,
  experience: experienceSchema,
  education: educationSchema,
  skills: skillsSchema,
  employment: employmentInfoSchema,
  communication: communicationInfoSchema
} as const;

type ValidationSchemaKeys = keyof typeof validationSchemas;
type ValidationResult<T extends ValidationSchemaKeys> = {
  success: true;
  data: z.infer<typeof validationSchemas[T]>;
} | {
  success: false;
  errors: string[];
};

export const validateData = <T extends ValidationSchemaKeys>(
  schemaKey: T,
  data: unknown
): ValidationResult<T> => {
  try {
    const schema = validationSchemas[schemaKey];
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
};
