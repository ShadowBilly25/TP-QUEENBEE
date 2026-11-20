import { createHivesRepository } from "./hives.repository.js";
import { createMeasuresRepository } from "./measures.repository.js";
import { createInspectionsRepository } from "./inspections.repository.js";

// Les trois repositories en mémoire, sous les noms que createApp attend.
export function createMemoryRepositories() {
  return {
    hivesRepository: createHivesRepository(),
    measuresRepository: createMeasuresRepository(),
    inspectionsRepository: createInspectionsRepository(),
  };
}
