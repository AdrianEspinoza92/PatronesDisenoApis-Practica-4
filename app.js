import { readFileSync } from 'node:fs';
import { ApolloServer } from '@apollo/server';
import { createDatabase } from './database.js';
import { createLoaders } from './dataloaders.js';
import { resolvers as optimizado } from './resolvers.js';
import { resolvers as ingenuo } from './resolvers.ingenuo.js';

export function createContext(options) {
  const db = createDatabase(options);
  return { db, loaders: createLoaders(db) };
}
export function createServer(mode = 'optimizado') {
  if (!['ingenuo', 'optimizado'].includes(mode)) throw new Error('Modo desconocido');
  return new ApolloServer({
    typeDefs: readFileSync(new URL('./schema.graphql', import.meta.url), 'utf8'),
    resolvers: mode === 'ingenuo' ? ingenuo : optimizado
  });
}
