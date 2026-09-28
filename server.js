import { startStandaloneServer } from '@apollo/server/standalone';
import { createServer, createContext } from './app.js';
const mode = process.argv.includes('--ingenuo') ? 'ingenuo' : 'optimizado';
const { url } = await startStandaloneServer(createServer(mode), {
  listen: { port: Number(process.env.PORT ?? 4000), host: '127.0.0.1' },
  // Se ejecuta de nuevo para CADA petición HTTP; nunca hay un loader global.
  context: async () => createContext()
});
console.log(`Servidor ${mode}: ${url}`);
