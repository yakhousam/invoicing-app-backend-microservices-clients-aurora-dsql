import { z } from "zod";

export const clientSchema = z.object({
  clientId: z.string(),
  userId: z.string(),
  clientName: z
    .string()
    .min(1, { message: "Client name is required" })
    .max(100),
  email: z.string().email().max(100),
  phone: z.union([z.string().min(10).max(20), z.literal(""), z.undefined()]),
  address: z.string().max(255).optional(),
  VATNumber: z.string().max(100).optional(),
  currencyPreference: z.string().optional().default("USD"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createClientSchema = clientSchema.omit({
  clientId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const clientArraySchema = z.array(clientSchema);

export const updateClientSchema = clientSchema
  .pick({
    clientName: true,
    email: true,
    phone: true,
    address: true,
    VATNumber: true,
    currencyPreference: true,
  })
  .partial();

export type Client = z.infer<typeof clientSchema>;

export type CreateClient = z.infer<typeof createClientSchema>;

export type UpdateClient = z.infer<typeof updateClientSchema>;
