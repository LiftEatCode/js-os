import { z } from 'zod';

export const JS_GROWTH_EVENT_VERSION = 1 as const;

export const JS_GROWTH_EVENT_TYPES = [
  'growth.quote_submitted',
  'growth.audit_completed',
] as const;

export type JsGrowthEventType = (typeof JS_GROWTH_EVENT_TYPES)[number];

const eventIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9:_-]+$/, 'eventId contains unsupported characters');

const utcTimestampSchema = z
  .string()
  .max(40)
  .refine(
    (value) =>
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(value) &&
      !Number.isNaN(Date.parse(value)),
    'occurredAt must be a valid UTC ISO-8601 timestamp',
  );

export const jsGrowthEventMetadataSchema = z
  .object({
    form_name: z.literal('contact').optional(),
    source: z.literal('website').optional(),
    audit_type: z.literal('website').optional(),
    result: z.literal('completed').optional(),
    score_band: z
      .enum(['excellent', 'good', 'needs_attention', 'critical'])
      .optional(),
  })
  .strict();

export const jsGrowthBusinessEventV1Schema = z
  .object({
    version: z.literal(JS_GROWTH_EVENT_VERSION),
    eventId: eventIdSchema,
    eventType: z.enum(JS_GROWTH_EVENT_TYPES),
    occurredAt: utcTimestampSchema,
    title: z.string().trim().min(1).max(200),
    metadata: jsGrowthEventMetadataSchema.optional(),
  })
  .strict();

export type JsGrowthBusinessEventV1 = z.infer<
  typeof jsGrowthBusinessEventV1Schema
>;

export function parseJsGrowthBusinessEvent(
  input: unknown,
): JsGrowthBusinessEventV1 {
  return jsGrowthBusinessEventV1Schema.parse(input);
}
