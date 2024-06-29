exports.up = function (knex) {
  return knex.schema.table("users", function (table) {
    table.datetime("last_login").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("users", function (table) {
    table.dropColumn("last_login");
  });
};
