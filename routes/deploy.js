// routes/deploy.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // wyłączamy weryfikację certyfikatu SSL
require("dotenv").config();                     // ładujemy .env

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const Knex = require("knex");
const router = express.Router();

// Pobieramy zmienne ze środowiska:
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Inicjalizujemy Supabase w trybie service_role:
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Inicjalizujemy Knex (Postgres) z SSL wyłączonym weryfikowaniem
const knex = Knex({
  client: "pg",
  connection: {
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,  // akceptujemy samopodpisane certyfikaty
    },
  },
});

/**
 * Funkcja tworzy w Postgresie prefiksowane tabele na podstawie JSON-owego schematu:
 * schema.tables = [
 *   {
 *     name: "nazwa_tabeli",
 *     fields: [
 *       { name: "pole1", type: "text", required: true, unique: false },
 *       { name: "inne_pole", type: "uuid", relation: { type: "belongsTo", table: "inna_nazwa", column: "id" } }
 *     ]
 *   },
 *   ...
 * ]
 */
async function createTablesWithKnex(slug, schema) {
  const prefix = slug.replace(/-/g, "_");

  // 1) Utworzenie tabel bez kluczy obcych
  for (const table of schema.tables) {
    const tableName = `${prefix}_${table.name}`;
    const exists = await knex.schema.hasTable(tableName);
    if (!exists) {
      await knex.schema.createTable(tableName, (t) => {
        // Kolumna id (UUID + domyślne gen_random_uuid())
        t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        // Timestampy
        t.timestamp("created_at").defaultTo(knex.fn.now());
        t.timestamp("updated_at").defaultTo(knex.fn.now());

        // Kolumny z JSON-a
        for (const field of table.fields) {
          let col;
          switch (field.type) {
            case "string":
            case "text":
              col = t.text(field.name);
              break;
            case "number":
              col = t.integer(field.name);
              break;
            case "boolean":
              col = t.boolean(field.name);
              break;
            case "date":
              col = t.timestamp(field.name);
              break;
            case "uuid":
              col = t.uuid(field.name);
              break;
            default:
              col = t.text(field.name);
          }
          if (field.required) col.notNullable();
          if (field.unique) col.unique();
          // Jeśli type="belongsTo", zostawiamy samą kolumnę,
          // constraint dodamy w kolejnym kroku.
        }
      });
    }
  }

  // 2) Dodajemy klucze obce (FOREIGN KEY)
  for (const table of schema.tables) {
    const tableName = `${prefix}_${table.name}`;
    for (const field of table.fields) {
      if (field.relation && field.relation.type === "belongsTo") {
        const targetTable = `${prefix}_${field.relation.table}`;
        const fkName = `${tableName}_${field.name}_fkey`;

        // Sprawdzamy, czy ten constraint już istnieje
        const [{ count }] = await knex.raw(
          `SELECT COUNT(*) FROM pg_constraint WHERE conname = ?;`,
          [fkName]
        );
        if (parseInt(count, 10) > 0) continue;

        // Dodajemy constraint do tabeli
        await knex.schema.alterTable(tableName, (t) => {
          t
            .foreign(field.name, fkName)
            .references(field.relation.column)
            .inTable(targetTable)
            .onDelete("SET NULL");
        });
      }
    }
  }
}

router.post("/deployTables", async (req, res) => {
  try {
    console.log("🔥 Otrzymane dane deployTables:", req.body);
    const { slug, schema, user_id } = req.body;

    // Sprawdzamy, czy przekazano wszystkie wymagane parametry
    if (!slug || !schema || !Array.isArray(schema.tables) || !user_id) {
      return res.status(400).json({
        error: "Niepoprawne dane: wymagane są slug, schema.tables i user_id",
      });
    }

    // 1) Tworzymy prefiksowane tabele w Postgresie
    console.log(`📊 Generowanie tabel dla slug=${slug}`);
    await createTablesWithKnex(slug, schema);
    console.log("✅ Prefiksowane tabele utworzone");

    // 2) Wstawiamy wpis do tabeli 'vendors' (rejestracja aplikacji)
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("vendors")
      .insert([{ user_id, slug, schema }]);

    if (insertErr) {
      console.error("❌ Błąd wstawiania do vendors:", insertErr);
      return res.status(500).json({ error: insertErr.message });
    }
    console.log("✅ Zapisano vendora w tabeli vendors:", inserted);

    return res.status(200).json({
      message: "Tabele utworzone i vendor zarejestrowany",
      tablesCreated: schema.tables.length,
    });
  } catch (err) {
    console.error("💥 Nieoczekiwany błąd:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
