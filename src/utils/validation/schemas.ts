import { z } from 'zod';

export const SalarySchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  currency: z.string().default('USD'),
}).refine(data => data.max >= data.min, {
  message: "Maximum salary must be greater than or equal to minimum salary",
});

export const JobSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Job title is required"),
  department: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  status: z.enum(['open', 'filled', 'cancelled']),
  postedDate: z.date(),
  filledDate: z.date().optional(),
  requirements: z.array(z.string()),
  salary: SalarySchema,
  description: z.string().min(10, "Job description must be at least 10 characters"),
});

export const CandidateSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone number"),
  status: z.enum(['Applied', 'Screened', 'Interviewed', 'Offered', 'Hired', 'Rejected']),
  appliedDate: z.date(),
  hireDate: z.date().optional(),
  source: z.string().optional(),
  sourcingCost: z.number().min(0).optional(),
  skills: z.array(z.string()),
  experience: z.number().min(0),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    graduationYear: z.number(),
  })),
  salary: z.object({
    expected: z.number().min(0),
    offered: z.number().min(0).optional(),
    currency: z.string().default('USD'),
  }),
});

export const ReportConfigSchema = z.object({
  timeframe: z.enum(['1month', '3months', '6months', '1year']),
  departments: z.array(z.string()),
  metrics: z.array(z.enum(['hiring_velocity', 'time_to_hire', 'cost_per_hire', 'acceptance_rate'])),
});

export type Job = z.infer<typeof JobSchema>;
export type Candidate = z.infer<typeof CandidateSchema>;
export type ReportConfig = z.infer<typeof ReportConfigSchema>;
