import pg      from 'pg';
import dotenv  from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

const { Pool } = pg;

// Railway (and most PaaS providers) inject a single DATABASE_URL.
// Fall back to individual DB_* vars for local development.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required on Railway / Render / Heroku
    })
  : new Pool({
      user:     process.env.DB_USER,
      host:     process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port:     Number(process.env.DB_PORT) || 5432,
    });

export default pool;
