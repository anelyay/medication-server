/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("schedule", (table) => {
    table.increments("id").primary();
    table
      .integer("medication_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("medications")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.string("med_time").notNullable();
    table.boolean("med_taken").defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("schedule");
};
