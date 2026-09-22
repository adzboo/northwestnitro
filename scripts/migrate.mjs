import {Pool} from 'pg';
import {readFileSync} from 'node:fs';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL before migrating.');
const pool=new Pool({connectionString:process.env.DATABASE_URL});const db=await pool.connect();
try{await db.query('BEGIN');await db.query('SELECT pg_advisory_xact_lock(73519201)');await db.query('CREATE TABLE IF NOT EXISTS nwn_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');const done=await db.query("SELECT id FROM nwn_migrations WHERE id='001_initial'");if(!done.rowCount){await db.query(readFileSync(new URL('../db/postgres.sql',import.meta.url),'utf8'));await db.query("INSERT INTO nwn_migrations (id) VALUES ('001_initial')");}await db.query('COMMIT');console.log('Database schema is ready.');}catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();await pool.end();}
