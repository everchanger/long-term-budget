import { config } from "dotenv";
import { resolve } from "path";

// Load test environment variables before anything else
const testEnvPath = resolve(process.cwd(), ".env.test");
config({ path: testEnvPath });
