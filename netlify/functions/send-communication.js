const { Resend } = require('resend');
const twilio = require('twilio');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { emailTo, emailSubject, emailBody, smsTo, smsBody } = JSON.parse(event.body);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  try {
    if (emailTo && emailSubject && emailBody) {
      await resend.emails.send({
        from: 'Contrology <onboarding@resend.dev>',
        to: emailTo,
        subject: emailSubject,
        html: emailBody,
      });
    }

    if (smsTo && smsBody) {
      await twilioClient.messages.create({
        body: smsBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: smsTo,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Comunicaciones enviadas con éxito.' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al enviar las comunicaciones.' }),
    };
  }
};