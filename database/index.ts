// import { drizzle } from "drizzle-orm/node-postgres";
// import { Client } from "pg";
// import * as schema from "./schema";

// const client = new Client({
//   host: process.env.DB_HOST || "localhost",
//   port: parseInt(process.env.DB_PORT || "5432"),
//   user: process.env.DB_USER || "budgetuser",
//   password: process.env.DB_PASSWORD || "budgetpass",
//   database: process.env.DB_NAME || "budgetdb",
//   ssl: false,
// });

// // Connect to the database
// client.connect().catch(console.error);

// export const db = drizzle(client, { schema });

// export { schema };
