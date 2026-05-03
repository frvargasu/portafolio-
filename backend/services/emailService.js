const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendPasswordResetEmail(to, resetUrl) {
  await transporter.sendMail({
    from: `"Inventario PYME" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Recuperación de contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3f51b5;">Recuperar contraseña</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace es válido por <strong>1 hora</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background-color: #3f51b5; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 6px; font-size: 16px;">
            Restablecer contraseña
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">
          Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no cambiará.
        </p>
        <p style="color: #666; font-size: 13px;">
          O copia este enlace en tu navegador:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `
  });
}

module.exports = { sendPasswordResetEmail };
