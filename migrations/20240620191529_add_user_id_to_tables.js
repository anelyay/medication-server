exports.up = async function (knex) {
  await knex.schema.table("patients", function (table) {
    table
      .integer("user_id")
      .unsigned()
      .references("users.id")
      .onDelete("CASCADE");
  });

  await knex.schema.table("medications", function (table) {
    table
      .integer("user_id")
      .unsigned()
      .references("users.id")
      .onDelete("CASCADE");
  });

  await knex.schema.table("schedule", function (table) {
    table
      .integer("user_id")
      .unsigned()
      .references("users.id")
      .onDelete("CASCADE");
  });

  await knex.schema.table("activity_log", function (table) {
    table
      .integer("user_id")
      .unsigned()
      .references("users.id")
      .onDelete("CASCADE");
  });
};

exports.down = async function (knex) {
  await knex.schema.table("patients", function (table) {
    table.dropColumn("user_id");
  });

  await knex.schema.table("medications", function (table) {
    table.dropColumn("user_id");
  });

  await knex.schema.table("schedule", function (table) {
    table.dropColumn("user_id");
  });

  await knex.schema.table("activity_log", function (table) {
    table.dropColumn("user_id");
  });
};
