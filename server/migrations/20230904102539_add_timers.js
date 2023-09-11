export const up = function (knex) {
  return knex.schema.createTable("timers", function (table) {
    table.increments("id");
    table.integer("user_id").notNullable();
    table.bigint("start").notNullable();
    table.bigint("end").defaultTo(null);
    table.string("description").notNullable();
    table.boolean("is_active").notNullable().defaultTo(false);
  });
};

export const down = function (knex) {
  return knex.schema.dropTable("timers");
};
