export function createInspectionsRepository(pool) {
  return {
    // La colonne author_id est obligatoire, mais l'authentification n'arrive qu'au TP 7.
    // En attendant, l'auteur est le propriétaire de la ruche ($2 est le hive_id, utilisé deux fois).
    async add(inspection) {
      const { rows } = await pool.query(
        `INSERT INTO inspections
           (id, hive_id, author_id, inspected_at, colony_status, queen_present, observations)
         VALUES ($1, $2, (SELECT owner_id FROM hives WHERE id = $2), $3, $4, $5, $6)
         RETURNING id, hive_id, inspected_at, colony_status, queen_present, observations`,
        [
          inspection.id,
          inspection.hive_id,
          inspection.inspected_at,
          inspection.colony_status,
          inspection.queen_present ?? null,
          inspection.observations ?? null,
        ],
      );
      return rows[0];
    },

    // Ajoutée comme dans la version en mémoire : le service s'en sert pour répondre 409 plutôt que 500.
    async existsById(id) {
      const { rowCount } = await pool.query(`SELECT 1 FROM inspections WHERE id = $1`, [id]);
      return rowCount > 0;
    },

    async findByHive(hiveId) {
      const { rows } = await pool.query(
        `SELECT id, hive_id, inspected_at, colony_status, queen_present, observations
           FROM inspections
          WHERE hive_id = $1
          ORDER BY inspected_at DESC`,
        [hiveId],
      );
      return rows;
    },
  };
}
