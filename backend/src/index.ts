import { createApp } from './app';
import { migrate } from './db/migrate';

const app = createApp();

await migrate();

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
