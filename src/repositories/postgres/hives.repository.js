
export function createHivesRepository(pool) {
  return {
    async findAll({ site_id, owner_id } = {}) {
      const conditions = [];
      const values = [];

      if (site_id) {
        values.push(site_id);
        conditions.push(`site_id = $${values.length}`);
      }

      if (owner_id) {
        values.push(owner_id);
        conditions.push(`owner_id = $${values.length}`);
      }

      const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const { rows } = await pool.query(
        `SELECT id, site_id, owner_id, ref_lat, ref_lon, status
         FROM hives
         ${where}
         ORDER BY id`,
        values,
      );

      return rows;
    },

    async findById(id) {
      const { rows } = await pool.query(
        `SELECT id, site_id, owner_id, ref_lat, ref_lon, status
         FROM hives
         WHERE id = $1`,
        [id],
      );

      return rows[0] ?? null;
    },
  };
}
