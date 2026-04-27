const express = require('express');
const router = express.Router();
const { proveedorController } = require('../controllers');
const { authenticate, isAdmin, proveedorValidation, commonValidation } = require('../middleware');

router.get('/', authenticate, commonValidation.pagination, proveedorController.getAll);
router.get('/:id', authenticate, commonValidation.id, proveedorController.getById);
router.post('/', authenticate, isAdmin, proveedorValidation.create, proveedorController.create);
router.put('/:id', authenticate, isAdmin, proveedorValidation.update, proveedorController.update);
router.delete('/:id', authenticate, isAdmin, commonValidation.id, proveedorController.remove);

module.exports = router;
