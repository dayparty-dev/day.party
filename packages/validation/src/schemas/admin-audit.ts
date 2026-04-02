import { z } from 'zod';

/** Shape for documenting stable admin audit action keys (004). */
export const adminAuditActionSchema = z.string().min(1).max(120);

export const adminAuditTargetTypeSchema = z.string().min(1).max(64);
