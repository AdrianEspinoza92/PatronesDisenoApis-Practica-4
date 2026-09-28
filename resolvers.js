export const resolvers = {
  Query: { clientes: (_, __, { db }) => db.fetchAllClientes() },
  Cliente: { facturas: (parent, _, { loaders }) => loaders.facturasPorCliente.load(parent.id) }
};
