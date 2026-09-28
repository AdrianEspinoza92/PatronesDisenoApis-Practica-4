import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, createContext } from '../app.js';
import { createLoaders } from '../dataloaders.js';
const options = { latencyMs: 0, log: () => {} };
const query = '{ clientes { id facturas { id monto } } }';
async function execute(mode, queryText = query) {
  const server = createServer(mode);
  const contextValue = createContext(options);
  try {
    const result = await server.executeOperation({ query: queryText }, { contextValue });
    assert.equal(result.body.kind, 'single');
    assert.equal(result.body.singleResult.errors, undefined);
    return { data: result.body.singleResult.data, metrics: contextValue.db.metrics };
  } finally { await server.stop(); }
}
test('Mismos datos: 6 consultas ingenuas frente a 2 optimizadas', async () => {
  const a = await execute('ingenuo');
  const b = await execute('optimizado');
  assert.deepEqual(a.data, b.data);
  assert.deepEqual(a.metrics, { clientes: 1, individuales: 5, lotes: 0 });
  assert.deepEqual(b.metrics, { clientes: 1, individuales: 0, lotes: 1 });
  assert.deepEqual(b.data.clientes[4].facturas, []);
});
test('Sin seleccionar facturas, no se consultan', async () => {
  const result = await execute('optimizado', '{ clientes { nombre } }');
  assert.deepEqual(result.metrics, { clientes: 1, individuales: 0, lotes: 0 });
});
test('Lote reordena resultados, soporta ausentes y reutiliza caché', async () => {
  let calls = 0;
  const loader = createLoaders({ async fetchFacturasByClienteIdsBatch(ids) {
    calls++;
    assert.deepEqual(ids, ['b', 'a', 'vacio']);
    return [{ id: '1', clienteId: 'a' }, { id: '2', clienteId: 'b' }];
  }}).facturasPorCliente;
  const result = await Promise.all(['b', 'a', 'vacio', 'b'].map(id => loader.load(id)));
  assert.deepEqual(result.map(rows => rows.map(row => row.id)), [['2'], ['1'], [], ['2']]);
  await loader.load('a');
  assert.equal(calls, 1);
});
test('Dos contextos no comparten caché', async () => {
  const a = createContext(options), b = createContext(options);
  await a.loaders.facturasPorCliente.load('c-1');
  await a.loaders.facturasPorCliente.load('c-1');
  await b.loaders.facturasPorCliente.load('c-1');
  assert.equal(a.db.metrics.lotes, 1);
  assert.equal(b.db.metrics.lotes, 1);
});
test('Aliases de facturas aprovechan caché en una operación', async () => {
  const result = await execute('optimizado', '{ clientes { a: facturas { id } b: facturas { id } } }');
  assert.equal(result.metrics.lotes, 1);
  for (const cliente of result.data.clientes) assert.deepEqual(cliente.a, cliente.b);
});
