exports.up = function (knex) {
  return knex.schema
    .table("medications", function (table) {
      table.string("notes");
      table.dropColumn("med_schedule");
      table.dropColumn("med_time");
      table.dropColumn("med_taken");
    })
    .alterTable("activity_log", function (table) {
      table.dropForeign(["patient_id"]);
      table.dropColumn("patient_id");
    });
};

exports.down = function (knex) {
  return knex.schema
    .table("medications", function (table) {
      table.dropColumn("notes");
      table.string("med_schedule");
      table.time("med_time");
      table.boolean("med_taken");
    })
    .alterTable("activity_log", function (table) {
      table.integer("patient_id").unsigned();
      table.foreign("patient_id").references("id").inTable("patients");
    });
};
