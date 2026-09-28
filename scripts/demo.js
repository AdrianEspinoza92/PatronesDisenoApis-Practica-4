import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createServer, createContext } from '../app.js';
const query = readFileSync(new URL('../queries/dashboard.graphql', import.meta.url), 'utf8');
mkdirSync(new URL('../evidencias/', import.meta.url), { recursive: true });
const results = [];
for (const mode of ['ingenuo', 'optimizado']) {
  const server = createServer(mode);
  const contexts = [];
  const logs = [];
  const { url } = await startStandaloneServer(server, {
    listen: { port: 0, host: '127.0.0.1' },
    context: async () => {
      const ctx = createContext({ log: line => { logs.push(line); console.log(line); } });
      contexts.push(ctx);
      return ctx;
    }
  });
  try {
    console.log(`\n=== ${mode.toUpperCase()} ===`);
    for (let request = 1; request <= 2; request++) {
      const start = performance.now();
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.errors, undefined);
      const metrics = contexts.at(-1).db.metrics;
      const total = Object.values(metrics).reduce((a,b) => a+b, 0);
      assert.equal(total, mode === 'ingenuo' ? 6 : 2);
      assert.deepEqual(body.data.clientes.at(-1).facturas, []);
      results.push({ mode, request, total, metrics, durationMs: Math.round(performance.now()-start), response: body });
      console.log(`Petición ${request}: ${total} consultas`);
    }
    writeFileSync(new URL(`../evidencias/${mode}.log`, import.meta.url), logs.join('\n')+'\n');
  } finally { await server.stop(); }
}
assert.deepEqual(results[0].response, results[2].response);
writeFileSync(new URL('../evidencias/resultados.json', import.meta.url), JSON.stringify(results, null, 2)+'\n');
console.log('Verificado: respuestas idénticas y caché nueva en la segunda petición.');
