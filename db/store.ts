import {Pool,type PoolClient} from 'pg';
let pool:Pool|undefined;
function connection(){if(!process.env.DATABASE_URL)throw new Error('Database not configured');return pool??=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});}
// Convert the application's bound SQLite placeholders; never substitute user values.
export function postgresSql(sql:string){let i=0;return sql.replace(/'(?:''|[^'])*'|\?/g,m=>m==="?"?'$'+(++i):m);}
class Statement{
 constructor(readonly sql:string,readonly values:unknown[]=[]){ }
 bind(...values:unknown[]){return new Statement(this.sql,values);}
 async all<T=Record<string,unknown>>(){const r=await connection().query(postgresSql(this.sql),this.values);return {results:r.rows as T[]};}
 async first<T=Record<string,unknown>>(){return (await this.all<T>()).results[0]??null;}
 async run(){return (await executeBatch([this]))[0];}
}
async function executeBatch(statements:Statement[]){for(let attempt=0;;attempt++){const client:PoolClient=await connection().connect();try{await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');const results=[];for(const s of statements){const r=await client.query(postgresSql(s.sql),s.values);results.push({results:r.rows,meta:{changes:r.rowCount??0}});}await client.query('COMMIT');return results;}catch(error){await client.query('ROLLBACK');if((error as {code?:string}).code==='40001'&&attempt<3)continue;throw error;}finally{client.release();}}}
export function database(){return {prepare:(sql:string)=>new Statement(sql),batch:executeBatch};}
export function runtime(){return process.env;}
