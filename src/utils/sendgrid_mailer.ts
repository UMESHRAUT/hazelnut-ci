import sendgrid from "@sendgrid/mail";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const msg = {
    to,
    from: process.env.SENDER_MAIL!,
    subject,
    text,
    html
  };
  try {
    await sendgrid.send(msg);
  } catch (e) {
    console.error(e);
  }
}
