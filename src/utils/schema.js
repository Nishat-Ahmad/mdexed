import { z } from 'zod';

export const blogFrontmatterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  readTime: z.string().min(1, "Read time is required"),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional()
});
