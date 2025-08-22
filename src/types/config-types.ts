// src/schema.ts
import { z } from 'zod';

export const ServiceSchema = z.object({
    url: z.string().startsWith('/'),
    directory: z.string(),
    injection: z.enum(['none', 'pipe', 'variable', 'argv']).optional().default('none'),
    injection_variable: z.string().optional().default('ANTENNA_BODY'),
    async: z.boolean().optional().default(false),
    commands: z.array(z.string()),
    delay: z.number().optional().default(0),
    secret: z.string().optional(),
    secret_header: z.string().optional(),
    show_output: z.boolean().optional().default(false)
});

export const ConfigSchema = z.record(z.string(), ServiceSchema);

export type ServiceConfig = z.infer<typeof ServiceSchema>;
export type Config = z.infer<typeof ConfigSchema>;