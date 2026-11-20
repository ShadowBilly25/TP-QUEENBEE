import { ValidationError } from "../errors.js";

const ranges = {
  position_lat: [-90, 90],
  position_lon: [-180, 180],
  weight_kg: [0, 150],
  temp_internal_c: [-10, 60],
  temp_external_c: [-20, 60],
  humidity_pct: [0, 100],
  acoustic_activity_score: [0, 1],
  battery_pct: [0, 100],
};

export function createMeasuresService({
  hivesService,
  measuresRepository,
}) {
  function validateMeasure(measure) {
    if (!measure.timestamp || !measure.weight_kg) {
      if (
        !measure.timestamp ||
        measure.weight_kg === undefined ||
        measure.weight_kg === null
      ) {
        throw new ValidationError(
          "timestamp et weight_kg sont obligatoires."
        );
      }
    }

    if (Number.isNaN(Date.parse(measure.timestamp))) {
      throw new ValidationError(
        "timestamp doit être une date valide."
      );
    }

    for (const [field, [min, max]] of Object.entries(ranges)) {
      const value = measure[field];

      if (value === undefined || value === null) {
        continue;
      }

      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < min ||
        value > max
      ) {
        throw new ValidationError(
          `${field} doit être compris entre ${min} et ${max}.`
        );
      }
    }
  }

  function addMeasure(hiveId, data) {
    const hive = hivesService.getHiveById(hiveId);

    if (data.hive_id !== undefined && data.hive_id !== hiveId) {
      throw new ValidationError(
        "Le hive_id du corps doit correspondre à celui du chemin."
      );
    }

    if (
      data.site_id !== undefined &&
      data.site_id !== hive.site_id
    ) {
      throw new ValidationError(
        "Le site_id ne correspond pas au site de la ruche."
      );
    }

    validateMeasure(data);

    const measure = {
      ...data,
      hive_id: hiveId,
      site_id: hive.site_id,
    };

    return measuresRepository.create(measure);
  }

  function getMeasures(hiveId, { limit = 50, offset = 0 } = {}) {
    hivesService.getHiveById(hiveId);

    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 500
    ) {
      throw new ValidationError(
        "limit doit être un entier compris entre 1 et 500."
      );
    }

    if (
      !Number.isInteger(parsedOffset) ||
      parsedOffset < 0
    ) {
      throw new ValidationError(
        "offset doit être un entier positif ou nul."
      );
    }

    const allMeasures = measuresRepository.findByHiveId(hiveId);

    return {
      items: allMeasures.slice(
        parsedOffset,
        parsedOffset + parsedLimit
      ),
      limit: parsedLimit,
      offset: parsedOffset,
    };
  }

  return {
    addMeasure,
    getMeasures,
  };
}