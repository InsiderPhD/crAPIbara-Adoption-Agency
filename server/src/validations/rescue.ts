import { z } from 'zod';

export const createRescueSchema = z.object({
  name: z.string().min(1).max(150),
  location: z.string().min(1).max(255),
  contactEmail: z.string().email(),
  description: z.string().min(1).max(2000),
  websiteUrl: z.string().url().optional(),
  registrationNumber: z.string().max(50).optional(),
});

export const updateRescueSchema = createRescueSchema.partial();

export type CreateRescueInput = z.infer<typeof createRescueSchema>;
export type UpdateRescueInput = z.infer<typeof updateRescueSchema>; 