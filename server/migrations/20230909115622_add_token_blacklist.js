export const up = function (knex) {
  return knex.schema.createTable("token_blacklist", function (table) {
    table.increments("id");
    table.string("token", 255).notNullable();
    table.index(["token"]);
  });
};

export const down = function (knex) {
  return knex.schema.dropTable("token_blacklist");
};
