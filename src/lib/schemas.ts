import { z } from "zod";

export const loginSchema = z.object({
  user: z.enum(["Sean", "Tina", "Faith"]),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(1, "Password is required"),
});

export const actionizeSchema = z.object({
  transcript: z.string().min(3, "Add or record a message first"),
  createdBy: z.enum(["Sean", "Tina", "Faith"]).default("Tina"),
});

export const summarizeCareNotesSchema = z.object({
  childName: z.enum(["Kieran", "Connor"]),
  rawNotes: z.string().min(10, "Add rough notes first"),
});

