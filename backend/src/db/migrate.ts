import { migrate as drizzleMigrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './connection';

export async function migrate() {
  await drizzleMigrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete');
}
