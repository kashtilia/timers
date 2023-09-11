import knexConfig from "./knexfile.js";
import knexFn from "knex";

const knex = knexFn(knexConfig);

// Выполнить запрос в БД
export const execQuery = async (queryFn) => {
  try {
    return await queryFn();
  } catch (err) {
    console.error(err);
  }
};

export const db = {
  // Найти пользователя по логину
  findUserByUsername: (username) => execQuery(() => knex("users").where({ username }).first()),
  // Найти пользователя по ID
  findUserById: (id) => execQuery(() => knex.table("users").where({ id }).first()),
  // Создать пользователя
  createUser: (user) =>
    execQuery(() =>
      knex
        .table("users")
        .insert(user)
        .returning("id")
        .then((result) => result[0].id)
    ),
  // Получить список таймеров пользователя
  getTimers: (userId, isActive) =>
    execQuery(() => {
      let query = knex
        .table("timers")
        .select("*")
        .select(knex.raw(`(${isActive ? Date.now() : '"end"'} - start) as progress, ("end" - start) as duration`))
        .where({
          user_id: userId,
        });

      if (isActive) {
        query.andWhere({
          is_active: isActive,
        });
      }

      return query;
    }),
  // Создать таймер
  createTimer: (timer) =>
    execQuery(() =>
      knex
        .table("timers")
        .insert(timer)
        .returning("id")
        .then((res) => ({ ...timer, id: res[0].id }))
    ),
  // Найти время начала таймера по его ID
  findTimerById: (id) =>
    execQuery(() =>
      knex.table("timers").select("*").select(knex.raw(`("end" - start) as progress`)).where({ id }).first()
    ),
  // Обновить таймер по ID
  updTimerById: (id, timer) => execQuery(() => knex.table("timers").update(timer).where({ id })),
  // Найти токен в черном списке
  findBlacklistToken: (token) => execQuery(() => knex.table("token_blacklist").where({ token }).first()),
  // Добавить токен в черный список
  addTokenToBlackList: (token) => execQuery(() => knex.table("token_blacklist").insert({ token })),
};
