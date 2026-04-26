import { z } from 'zod'

export const CreateUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.email({ error: 'Invalid email address' }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
