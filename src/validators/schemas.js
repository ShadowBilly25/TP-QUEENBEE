
import Joi from "joi";

// Messages communs aux schémas.
const MESSAGES = {
  "any.required": "{{#label}} est obligatoire.",
  "number.base": "{{#label}} doit être un nombre.",
  "number.min": "{{#label}} doit être supérieur ou égal à {{#limit}}.",
  "number.max": "{{#label}} doit être inférieur ou égal à {{#limit}}.",
  "number.integer": "{{#label}} doit être un entier.",
  "string.base": "{{#label}} doit être un texte.",
  "string.isoDate": "{{#label}} doit être une date ISO 8601 valide.",
  "string.guid": "{{#label}} doit être un UUID valide.",
  "any.only": "{{#label}} doit avoir une valeur autorisée.",
  "object.base": "Le corps de la requête doit être un objet JSON.",
  "object.unknown": "{{#label}} n’est pas un champ autorisé.",
  "date.max": "{{#label}} ne peut pas être dans le futur.",
};

const hiveId = Joi.string().trim().required();

export const hiveParamsSchema = Joi.object({
  id: hiveId,
}).messages(MESSAGES);

export const listHivesQuerySchema = Joi.object({
  site_id: Joi.string().trim().allow("").optional(),
}).messages(MESSAGES);

export const measureSchema = Joi.object({
  timestamp: Joi.string().isoDate().required(),

  weight_kg: Joi.number().min(0).max(150).required(),

  hive_id: Joi.alternatives().try(
    Joi.string(),
    Joi.number()
  ).optional(),

  position_lat: Joi.number().min(-90).max(90).optional(),
  position_lon: Joi.number().min(-180).max(180).optional(),

  temp_internal_c: Joi.number().min(-10).max(60).optional(),
  temp_external_c: Joi.number().min(-20).max(60).optional(),

  humidity_pct: Joi.number().min(0).max(100).optional(),

  acoustic_activity_score: Joi.number().min(0).max(1).optional(),

  battery_pct: Joi.number().min(0).max(100).optional(),
})
  .unknown(false)
  .messages(MESSAGES);

export const measuresQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(500).default(50),
  offset: Joi.number().integer().min(0).default(0),
}).messages(MESSAGES);

export const inspectionSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ["uuidv4", "uuidv5"] })
    .required(),

  inspected_at: Joi.string()
    .isoDate()
    .custom((value, helpers) => {
      if (Date.parse(value) > Date.now()) {
        return helpers.error("date.max");
      }
      return value;
    })
    .required(),

  colony_status: Joi.string()
    .valid("forte", "normale", "faible", "morte")
    .required(),

  queen_present: Joi.boolean().optional(),

  observations: Joi.string().optional(),
})
  .unknown(false)
  .messages(MESSAGES);


// -----------------------------------------------------------------------------
// Authentification
// -----------------------------------------------------------------------------

const authEmail = Joi.string()
  .email({ tlds: { allow: false } })
  .max(254)
  .required();

export const registerSchema = Joi.object({
  email: authEmail,

  password: Joi.string()
    .min(12)
    .max(72)
    .required(),

  role: Joi.string()
    .valid("apiculteur", "coordinateur", "gestionnaire", "admin")
    .required(),

  site_id: Joi.when("role", {
    is: Joi.valid("apiculteur", "coordinateur"),
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
  }),
})
  .unknown(false)
  .messages(MESSAGES);

export const loginSchema = Joi.object({
  email: authEmail,

  password: Joi.string()
    .required(),
})
  .unknown(false)
  .messages(MESSAGES);

export const refreshSchema = Joi.object({
  refresh_token: Joi.string()
    .required(),
})
  .unknown(false)
  .messages(MESSAGES);


  const syncInspectionItemSchema = inspectionSchema.keys({
  hive_id: Joi.string().trim().required(),

  version: Joi.number()
    .integer()
    .min(1)
    .optional(),
});

export const syncInspectionsSchema = Joi.object({
  inspections: Joi.array()
    .items(syncInspectionItemSchema)
    .min(1)
    .max(500)
    .required(),
})
  .unknown(false)
  .messages(MESSAGES);
