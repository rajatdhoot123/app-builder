export default {
  dialect: 'sqlite',
  schema: './src/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: 'database.db',
  },
};