import { z } from 'zod';

// Advanced validation rules for various data types
export const advancedValidationRules = {
  // Personal Information
  personalInfo: {
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
      .regex(/^\+?[\d\s-()]{10,}$/, 'Invalid phone number format')
      .refine(phone => phone.replace(/\D/g, '').length >= 10, 'Phone number must have at least 10 digits'),
    
    address: z.object({
      street: z.string().min(5, 'Street address must be at least 5 characters'),
      city: z.string().min(2, 'City must be at least 2 characters'),
      state: z.string().length(2, 'State must be a 2-letter code'),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
      country: z.string().min(2, 'Country must be at least 2 characters'),
    }),
  },

  // Professional Information
  professionalInfo: {
    experience: z.array(z.object({
      company: z.string().min(2, 'Company name must be at least 2 characters'),
      title: z.string().min(2, 'Job title must be at least 2 characters'),
      startDate: z.date(),
      endDate: z.date().optional(),
      description: z.string().min(20, 'Description must be at least 20 characters'),
    })).refine(experiences => {
      return experiences.every(exp => !exp.endDate || exp.endDate > exp.startDate);
    }, 'End date must be after start date'),

    education: z.array(z.object({
      institution: z.string().min(2, 'Institution name must be at least 2 characters'),
      degree: z.string().min(2, 'Degree must be at least 2 characters'),
      field: z.string().min(2, 'Field of study must be at least 2 characters'),
      graduationDate: z.date(),
      gpa: z.number().min(0).max(4).optional(),
    })),

    skills: z.array(z.string())
      .min(1, 'At least one skill is required')
      .refine(skills => new Set(skills).size === skills.length, 'Duplicate skills are not allowed'),
  },

  // Job Information
  jobInfo: {
    job: z.object({
      title: z.string().min(5, 'Job title must be at least 5 characters'),
      description: z.string().min(50, 'Job description must be at least 50 characters'),
      requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
      salary: z.object({
        min: z.number().positive('Minimum salary must be positive'),
        max: z.number().positive('Maximum salary must be positive'),
      }).refine(salary => salary.max > salary.min, 'Maximum salary must be greater than minimum salary'),
      location: z.object({
        type: z.enum(['remote', 'office', 'hybrid']),
        address: z.string().optional(),
        timezone: z.string().optional(),
      }),
      employmentType: z.enum(['full-time', 'part-time', 'contract', 'temporary']),
      department: z.string().min(2, 'Department must be at least 2 characters'),
    }),
  },

  // Financial Information
  financialInfo: {
    invoice: z.object({
      number: z.string().regex(/^INV-\d{6}$/, 'Invalid invoice number format'),
      amount: z.number()
        .positive('Amount must be positive')
        .max(1000000, 'Amount cannot exceed 1,000,000'),
      currency: z.string().length(3, 'Currency must be a 3-letter code'),
      dueDate: z.date().min(new Date(), 'Due date must be in the future'),
      items: z.array(z.object({
        description: z.string().min(5, 'Item description must be at least 5 characters'),
        quantity: z.number().positive('Quantity must be positive'),
        unitPrice: z.number().positive('Unit price must be positive'),
      })).min(1, 'At least one item is required'),
    }).refine(invoice => {
      const total = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      return Math.abs(total - invoice.amount) < 0.01;
    }, 'Total amount must match sum of items'),
  },

  // Document Information
  documentInfo: {
    document: z.object({
      title: z.string().min(2, 'Title must be at least 2 characters'),
      type: z.enum(['resume', 'cover_letter', 'certificate', 'other']),
      fileSize: z.number().max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
      fileType: z.enum(['pdf', 'doc', 'docx']),
      uploadDate: z.date(),
      expiryDate: z.date().optional(),
      tags: z.array(z.string()).max(10, 'Cannot have more than 10 tags'),
    }).refine(doc => !doc.expiryDate || doc.expiryDate > doc.uploadDate, 
      'Expiry date must be after upload date'),
  },

  // Communication Information
  communicationInfo: {
    message: z.object({
      subject: z.string().min(2, 'Subject must be at least 2 characters'),
      content: z.string().min(10, 'Content must be at least 10 characters'),
      priority: z.enum(['low', 'medium', 'high']),
      recipients: z.array(z.string().email('Invalid email format')).min(1, 'At least one recipient is required'),
      cc: z.array(z.string().email('Invalid email format')).optional(),
      bcc: z.array(z.string().email('Invalid email format')).optional(),
      attachments: z.array(z.object({
        name: z.string(),
        size: z.number().max(10 * 1024 * 1024, 'Attachment size cannot exceed 10MB'),
        type: z.string(),
      })).optional(),
    }).refine(message => {
      const totalAttachmentSize = (message.attachments || [])
        .reduce((sum, att) => sum + att.size, 0);
      return totalAttachmentSize <= 25 * 1024 * 1024;
    }, 'Total attachment size cannot exceed 25MB'),
  },
};

// Helper function to validate data against advanced rules
export const validateWithAdvancedRules = async <T extends keyof typeof advancedValidationRules>(
  ruleType: T,
  data: unknown
): Promise<{ success: true; data: z.infer<typeof advancedValidationRules[T]> } | { success: false; errors: string[] }> => {
  try {
    const schema = advancedValidationRules[ruleType];
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
