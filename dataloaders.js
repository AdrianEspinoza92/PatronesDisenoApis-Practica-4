import DataLoader from 'dataloader';

export function createLoaders(db) {
  return {
    facturasPorCliente: new DataLoader(async clienteIds => {
      const rows = await db.fetchFacturasByClienteIdsBatch(clienteIds);
      const grouped = new Map(clienteIds.map(id => [id, []]));
      for (const row of rows) grouped.get(row.clienteId).push(row);
      // Un resultado por clave, en el mismo orden. Sin facturas devuelve [].
      return clienteIds.map(id => grouped.get(id));
    })
  };
}
