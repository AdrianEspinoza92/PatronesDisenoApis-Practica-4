// Datos adaptados del repositorio docente pmpvhr/graphql.
const CLIENTES_RECORDS = [
    { id: "c-1", nombre: "Corporación Alfa", sector: "Finanzas" },
    { id: "c-2", nombre: "Logística Beta", sector: "Transporte" },
    { id: "c-3", nombre: "Industrias Gamma", sector: "Manufactura" },
    { id: "c-4", nombre: "Tecnología Delta", sector: "Educación" },
    { id: "c-5", nombre: "Retail Epsilon", sector: "Comercio" }
];

const FACTURAS_RECORDS = [
    { id: "f-101", clienteId: "c-1", monto: 1500.00, estado: "PAGADA" },
    { id: "f-102", clienteId: "c-1", monto: 2300.50, estado: "PENDIENTE" },
    { id: "f-103", clienteId: "c-2", monto: 450.00,  estado: "PAGADA" },
    { id: "f-104", clienteId: "c-3", monto: 8900.00, estado: "PAGADA" },
    { id: "f-105", clienteId: "c-3", monto: 1200.00, estado: "ANULADA" },
    { id: "f-106", clienteId: "c-4", monto: 350.00,  estado: "PAGADA" },
    // El cliente 5 ('c-5') deliberadamente no tiene facturas para evaluar robustez del código
];


// Una instancia por petición mantiene las métricas aisladas.
export function createDatabase({ latencyMs = 200, log = console.log } = {}) {
  const metrics = { clientes: 0, individuales: 0, lotes: 0 };
  async function read(kind, message) {
    metrics[kind]++;
    log(`[DB QUERY] ${message}`);
    await new Promise(resolve => setTimeout(resolve, latencyMs));
  }
  return {
    metrics,
    async fetchAllClientes() {
      await read('clientes', 'SELECT * FROM clientes;');
      return CLIENTES_RECORDS.map(row => ({ ...row }));
    },
    async fetchFacturasByClienteId(id) {
      await read('individuales', `SELECT * FROM facturas WHERE cliente_id = '${id}';`);
      return FACTURAS_RECORDS.filter(row => row.clienteId === id).map(row => ({ ...row }));
    },
    async fetchFacturasByClienteIdsBatch(ids) {
      // SQL ilustrativo: una BD real debe usar parámetros, nunca interpolación.
      await read('lotes', `SELECT * FROM facturas WHERE cliente_id IN (${ids.map(id => `'${id}'`).join(', ')});`);
      const keys = new Set(ids);
      return FACTURAS_RECORDS.filter(row => keys.has(row.clienteId)).map(row => ({ ...row }));
    }
  };
}
