/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("medications", (table) => {
    table.increments("id").primary();
    table
      .integer("patient_id")
      .unsigned()
      .references("patients.id")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.string("med_name").notNullable();
    table.string("med_dose").notNullable();
    table.integer("med_schedule").notNullable();
    table.string("med_time").notNullable();
    table.boolean("med_taken").defaultTo(false);
    table.integer("quantity").notNullable();
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
  return knex.schema.dropTable("medications");
};
