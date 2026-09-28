export const resolvers = {
  Query: { clientes: (_, __, { db }) => db.fetchAllClientes() },
  Cliente: { facturas: (parent, _, { db }) => db.fetchFacturasByClienteId(parent.id) }
};
