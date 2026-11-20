import { NotFoundError } from "../errors.js";

export function createHivesService({ hivesRepository }) {
  function getAllHives(filters = {}) {
    return hivesRepository.findAll(filters);
  }

  function getHiveById(id) {
    const hive = hivesRepository.findById(id);

    if (!hive) {
      throw new NotFoundError(
        `La ruche ${id} n'existe pas.`
      );
    }

    return hive;
  }

  return {
    getAllHives,
    getHiveById,
  };
}