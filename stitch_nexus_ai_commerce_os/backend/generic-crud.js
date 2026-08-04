// ─────────────────────────────────────────────────────────────────
// Generic CRUD Router Factory
// Dipakai untuk modul-modul yang butuh List/Create/Update/Delete
// sederhana ke satu tabel, supaya tidak menulis ulang boilerplate
// yang sama di puluhan modul (margin rules, tenants, ai models, dst).
// ─────────────────────────────────────────────────────────────────
const express = require('express');

/**
 * @param {import('pg').Pool} pool
 * @param {string} tableName - nama tabel (harus sudah dibuat sebelumnya)
 * @param {string[]} allowedFields - kolom yang boleh diisi lewat POST/PUT
 * @param {string} orderBy - default ORDER BY
 */
function createCrudRouter(pool, tableName, allowedFields, orderBy = 'id DESC') {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`);
      res.json(result.rows);
    } catch (err) {
      console.error(`[CRUD ${tableName}] GET error:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Tidak ditemukan' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const fields = allowedFields.filter((f) => req.body[f] !== undefined);
      if (fields.length === 0) return res.status(400).json({ error: 'Tidak ada field valid dikirim' });
      const values = fields.map((f) => req.body[f]);
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(`[CRUD ${tableName}] POST error:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const fields = allowedFields.filter((f) => req.body[f] !== undefined);
      if (fields.length === 0) return res.status(400).json({ error: 'Tidak ada field valid dikirim' });
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map((f) => req.body[f]);
      values.push(req.params.id);
      const result = await pool.query(
        `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
        values
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Tidak ditemukan' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Tidak ditemukan' });
      res.json({ deleted: true, id: result.rows[0].id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createCrudRouter };
