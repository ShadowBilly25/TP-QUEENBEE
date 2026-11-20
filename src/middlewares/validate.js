
import { ValidationError } from "../errors.js";

export function validate({ params, query, body } = {}) {
  return (req, res, next) => {
    try {
      const validated = {};

      for (const [source, schema] of Object.entries({
        params,
        query,
        body,
      })) {
        if (!schema) continue;

        const input = source === "body" && req[source] === undefined
          ? {}
          : req[source];

        const { error, value } = schema.validate(input, {
          abortEarly: false,
          convert: true,
          messages: {
            "any.required": "{{#label}} est obligatoire.",
          },
          errors: {
            wrap: { label: false },
          },
        });

        if (error) {
          const details = error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          }));

          throw new ValidationError(
            details.map((item) => item.message).join(" "),
            details
          );
        }

        validated[source] = value;
      }

      req.validated = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}
