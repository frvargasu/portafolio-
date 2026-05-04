/**
 * Controlador de Autenticación
 * Maneja las rutas de registro, login y perfil
 */
const { authService, usuarioService } = require('../services');
const { asyncHandler } = require('../middleware');

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
const register = asyncHandler(async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  
  const result = await authService.register({ nombre, email, password, rol });
  
  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    data: result
  });
});

/**
 * POST /api/auth/login
 * Inicia sesión
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await authService.login(email, password);
  
  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: result
  });
});

/**
 * GET /api/auth/profile
 * Obtiene el perfil del usuario autenticado
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await usuarioService.getProfile(req.user.id);
  
  res.json({
    success: true,
    data: profile
  });
});

/**
 * PUT /api/auth/profile
 * Actualiza el perfil del usuario autenticado
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { nombre } = req.body;
  
  const profile = await usuarioService.updateProfile(req.user.id, { nombre });
  
  res.json({
    success: true,
    message: 'Perfil actualizado exitosamente',
    data: profile
  });
});

/**
 * PUT /api/auth/change-password
 * Cambia la contraseña del usuario autenticado
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  
  res.json({
    success: true,
    message: 'Contraseña actualizada exitosamente'
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  // Respuesta genérica para no revelar si el email existe
  res.json({
    success: true,
    message: 'Si el correo está registrado, recibirás un enlace de recuperación en breve'
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  await authService.resetPassword(token, password);
  res.json({
    success: true,
    message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión'
  });
});

/**
 * POST /api/auth/logout
 * Invalida el token actual insertándolo en la blacklist
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  await authService.logout(token, req.user.id);
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
};
