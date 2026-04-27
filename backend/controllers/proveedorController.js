const { proveedorService } = require('../services');
const { asyncHandler } = require('../middleware');

const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, includeInactive } = req.query;

  const result = await proveedorService.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    includeInactive: includeInactive === 'true'
  });

  res.json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const proveedor = await proveedorService.getById(parseInt(req.params.id));
  res.json({ success: true, data: proveedor });
});

const create = asyncHandler(async (req, res) => {
  const { nombre, contacto, email, telefono, direccion, notas } = req.body;
  const proveedor = await proveedorService.create({ nombre, contacto, email, telefono, direccion, notas });
  res.status(201).json({ success: true, message: 'Proveedor creado exitosamente', data: proveedor });
});

const update = asyncHandler(async (req, res) => {
  const { nombre, contacto, email, telefono, direccion, notas, activo } = req.body;
  const proveedor = await proveedorService.update(parseInt(req.params.id), {
    nombre, contacto, email, telefono, direccion, notas, activo
  });
  res.json({ success: true, message: 'Proveedor actualizado exitosamente', data: proveedor });
});

const remove = asyncHandler(async (req, res) => {
  await proveedorService.delete(parseInt(req.params.id));
  res.json({ success: true, message: 'Proveedor eliminado exitosamente' });
});

module.exports = { getAll, getById, create, update, remove };
