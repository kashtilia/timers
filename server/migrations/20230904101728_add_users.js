export const up = function (knex) {
  return knex.schema.createTable("users", function (table) {
    table.increments("id");
    table.string("username", 255).notNullable();
    table.string("password", 255).notNullable();
    table.index(["username"]);
  });
};

export const down = function (knex) {
  return knex.schema.dropTable("users");
};
