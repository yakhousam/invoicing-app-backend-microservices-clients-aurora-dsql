import { z } from 'zod'

export const clientSchema = z.object({
  clientId: z.string(),
  userId: z.string(),
  clientName: z.string().min(1, { message: 'Client name is required' }),
  email: z.union([z.string().email(), z.literal(''), z.undefined()]),
  phone: z.union([z.string().min(10), z.literal(''), z.undefined()]),
  address: z.string().optional(),
  VATNumber: z.string().optional(),
  currencyPreference: z.string().optional().default('USD'),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const createClientSchema = clientSchema.omit({
  clientId: true,
  userId: true,
  createdAt: true,
  updatedAt: true
})

export const clientArraySchema = z.array(clientSchema)

export const updateClientSchema = clientSchema.omit({
  clientId: true,
  userId: true,
  createdAt: true,
  updatedAt: true
})

export const getAllClientsQuerySchema = z.object({
  limit: z
    .union([
      z.string().refine(
        (val) => {
          const num = parseInt(val, 10)
          return !isNaN(num) && num > 0
        },
        { message: 'Limit must be an integer greater than 0' }
      ),
      z.undefined()
    ])
    .default('10'),
  lastEvaluatedKey: z.union([
    z.string().refine(
      (val) => {
        try {
          const parsed = JSON.parse(val)
          return (
            typeof parsed === 'object' &&
            parsed !== null &&
            'clientId' in parsed
          )
        } catch {
          return false
        }
      },
      { message: 'Invalid JSON format for lastEvaluatedKey' }
    ),
    z.undefined()
  ])
})

export type Client = z.infer<typeof clientSchema>

export type CreateClient = z.infer<typeof createClientSchema>

export type UpdateClient = z.infer<typeof updateClientSchema>
