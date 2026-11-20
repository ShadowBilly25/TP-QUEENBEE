import { test } from "node:test";
import assert from "node:assert/strict";
import { createMeasuresService } from "../src/services/measures.service.js";
import { ValidationError, NotFoundError } from "../src/errors.js";

// Un faux repository : il garde ce qu'on lui donne, sans base ni mémoire partagée.
function fauxRepository() {
  const enregistrees = [];
  return {
    enregistrees,
    async add(mesure) {
      enregistrees.push(mesure);
      return mesure;
    },
    async findByHive() {
      return enregistrees;
    },
  };
}

// Un faux service des ruches : une seule ruche existe.
const hivesService = {
  async getById(id) {
    if (id !== "SN-CASA-001") throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
    return { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" };
  },
};

const trame = (surcharge = {}) => ({ timestamp: "2026-10-31T10:00:00Z", weight_kg: 36.84, ...surcharge });

test("refuse un poids hors de sa plage physique", async () => {
  // Préparer : un faux repository injecté dans le service
  const measuresRepository = fauxRepository();
  const service = createMeasuresService({ hivesService, measuresRepository });

  // Agir : ajouter une mesure de 500 kg
  const ajout = service.add("SN-CASA-001", trame({ weight_kg: 500 }));

  // Vérifier : une ValidationError est levée, et rien n'est enregistré
  await assert.rejects(ajout, ValidationError);
  assert.equal(measuresRepository.enregistrees.length, 0);
});

test("accepte les bornes de la plage physique", async () => {
  const measuresRepository = fauxRepository();
  const service = createMeasuresService({ hivesService, measuresRepository });

  await service.add("SN-CASA-001", trame({ weight_kg: 0 }));
  await service.add("SN-CASA-001", trame({ weight_kg: 150, battery_pct: 100, position_lat: -90 }));

  assert.equal(measuresRepository.enregistrees.length, 2);
});

test("refuse un champ facultatif hors plage ou qui n'est pas un nombre", async () => {
  const measuresRepository = fauxRepository();
  const service = createMeasuresService({ hivesService, measuresRepository });

  await assert.rejects(service.add("SN-CASA-001", trame({ humidity_pct: 101 })), ValidationError);
  await assert.rejects(service.add("SN-CASA-001", trame({ temp_internal_c: "chaud" })), ValidationError);
  assert.equal(measuresRepository.enregistrees.length, 0);
});

test("refuse une mesure pour une ruche inconnue, sans rien enregistrer", async () => {
  const measuresRepository = fauxRepository();
  const service = createMeasuresService({ hivesService, measuresRepository });

  await assert.rejects(service.add("XX-NOPE-999", trame()), NotFoundError);
  assert.equal(measuresRepository.enregistrees.length, 0);
});
