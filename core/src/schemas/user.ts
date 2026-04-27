import { z } from 'zod'

export const CreateUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.email({ error: 'Invalid email address' }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.email({ error: 'Invalid email address' }),
  password: z.string().refine(
    (val) => val === '' || val.length >= 8,
    'Password must be at least 8 characters'
  ),
})

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
