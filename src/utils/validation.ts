import { z } from 'zod';

// Common validation schemas
const emailSchema = z.string().email('Invalid email format');
const phoneSchema = z.string().regex(/^\+?[\d\s-()]{10,}$/, 'Invalid phone number format');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// User validation
export const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: passwordSchema,
  email: emailSchema,
  role: z.enum(['CEO', 'CFO', 'Superadmin', 'Admin', 'User', 'Reception']),
});

// Candidate validation
export const candidateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  experience: z.string().min(10, 'Experience description must be at least 10 characters'),
  status: z.enum(['applied', 'interviewed', 'hired', 'rejected']),
});

// Job validation
export const jobSchema = z.object({
  title: z.string().min(5, 'Job title must be at least 5 characters'),
  description: z.string().min(50, 'Job description must be at least 50 characters'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  salary: z.string().min(1, 'Salary is required'),
  status: z.enum(['active', 'filled', 'closed']),
});

// Client validation
export const clientSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  contactPerson: z.string().min(2, 'Contact person name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(10, 'Address must be at least 10 characters'),
  status: z.enum(['active', 'inactive']),
});

// Invoice validation
export const invoiceSchema = z.object({
  clientId: z.number().positive('Client must be selected'),
  candidateId: z.number().positive('Candidate must be selected'),
  amount: z.number().positive('Amount must be greater than 0'),
  status: z.enum(['draft', 'sent', 'paid']),
  dueDate: z.date().min(new Date(), 'Due date must be in the future'),
});

// Validation helper function
export const validateData = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> => {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => e.message),
      };
    }
    return {
      success: false,
      errors: ['An unexpected error occurred during validation'],
    };
  }
};
