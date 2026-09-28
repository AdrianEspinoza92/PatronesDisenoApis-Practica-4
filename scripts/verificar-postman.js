// Ejecuta los scripts de la colección con un adaptador mínimo de la API pm.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createServer, createContext } from '../app.js';
const collection = JSON.parse(readFileSync(new URL('../postman/Practica04.postman_collection.json', import.meta.url)));
for (const mode of ['ingenuo', 'optimizado']) {
  const server = createServer(mode);
  const expected = mode === 'ingenuo' ? [6,1,6,11,6,0] : [2,1,2,2,2,0];
  let reads = 0, assertions = 0;
  const { url } = await startStandaloneServer(server, {
    listen: { port: 0, host: '127.0.0.1' },
    context: async () => createContext({ latencyMs: 0, log: () => reads++ })
  });
  try {
    for (const [i, item] of collection.item.entries()) {
      reads = 0;
      const response = await fetch(url, { method: item.request.method, headers: { 'Content-Type': 'application/json' }, body: item.request.body.raw });
      const body = await response.json();
      const pm = {
        response: { json: () => body, to: { have: { status: code => assert.equal(response.status, code) } } },
        test: (name, fn) => { fn(); assertions++; },
        expect: value => ({ to: { equal: other => assert.equal(value, other), deep: { equal: other => assert.equal(JSON.stringify(value), JSON.stringify(other)) } } })
      };
      for (const event of item.event) vm.runInNewContext(event.script.exec.join('\n'), { pm });
      assert.equal(reads, expected[i], item.name);
      console.log(`${mode}: ${item.name} OK (${reads} lecturas)`);
    }
    console.log(`${assertions} validaciones aprobadas en ${mode}`);
  } finally { await server.stop(); }
}
