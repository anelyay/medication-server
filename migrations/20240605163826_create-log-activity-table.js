/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("activity_log", (table) => {
    table.increments("id").primary();
    table
      .integer("patient_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("patients")
      .onDelete("CASCADE");
    table
      .integer("medication_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("medications")
      .onDelete("CASCADE");
    table.timestamp("med_time").notNullable();
    table.boolean("med_taken").notNullable();
    table.integer("quantity").notNullable();
    table.timestamp("log_time").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("activity_log");
};
