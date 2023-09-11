import dotenv from "dotenv";

dotenv.config();

const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, ENDPOINT_ID } = process.env;

export default {
  client: "pg",
  connection: `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?options=project%3D${ENDPOINT_ID}&sslmode=require`,
  migrations: {
    tableName: "migrations",
  },
};
