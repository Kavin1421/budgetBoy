import nodemailer from "nodemailer";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { enforceWriteGuard } from "@/lib/api/guards";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";
import { contactInquirySchema } from "@/utils/validators";

const BRAND_GRADIENT = "linear-gradient(135deg,#0f766e 0%,#059669 55%,#0ea5e9 100%)";
const WEBSITE_URL = "https://budget-boy-ochre.vercel.app";
const WHATSAPP_URL = "https://wa.me/919677723429";
const CONTACT_EMAIL = "godevsteam@gmail.com";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function teamInquiryHtml(name: string, email: string, message: string) {
  return `
    <div style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 8px 30px rgba(15,23,42,0.08)">
              <tr>
                <td style="padding:22px 24px;background:${BRAND_GRADIENT};color:#ecfeff">
                  <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;opacity:.9">BudgetBoy</p>
                  <h1 style="margin:6px 0 0;font-size:22px;line-height:1.25;color:#ffffff">New Contact Inquiry</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px 24px">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px">
                    <tr>
                      <td style="font-size:13px;font-weight:700;color:#334155;width:90px">Name</td>
                      <td style="font-size:14px;color:#0f172a">${name}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;font-weight:700;color:#334155">Email</td>
                      <td style="font-size:14px;color:#0f172a">${email}</td>
                    </tr>
                  </table>
                  <p style="margin:14px 0 8px;font-size:13px;font-weight:700;color:#334155">Message</p>
                  <div style="padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;font-size:14px;line-height:1.55;color:#0f172a">
                    ${message}
                  </div>
                  <div style="margin-top:16px;padding-top:14px;border-top:1px solid #e2e8f0">
                    <p style="margin:0 0 8px;font-size:12px;color:#64748b">Quick actions</p>
                    <p style="margin:0;font-size:13px;line-height:1.6">
                      <a href="${WEBSITE_URL}" style="color:#0f766e;text-decoration:none;font-weight:600">Open website</a>
                      <span style="color:#94a3b8"> · </span>
                      <a href="${WHATSAPP_URL}" style="color:#0f766e;text-decoration:none;font-weight:600">WhatsApp</a>
                      <span style="color:#94a3b8"> · </span>
                      <a href="mailto:${CONTACT_EMAIL}" style="color:#0f766e;text-decoration:none;font-weight:600">${CONTACT_EMAIL}</a>
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function userAcknowledgementHtml(name: string) {
  return `
    <div style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 8px 30px rgba(15,23,42,0.08)">
              <tr>
                <td style="padding:22px 24px;background:${BRAND_GRADIENT};color:#ecfeff">
                  <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;opacity:.9">BudgetBoy × GodevsTeam</p>
                  <h1 style="margin:6px 0 0;font-size:22px;line-height:1.25;color:#ffffff">We received your inquiry</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px 24px">
                  <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#334155">Hi ${name},</p>
                  <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#0f172a">
                    Thanks for reaching out. Our team has received your message and will get back to you shortly with next steps.
                  </p>
                  <div style="margin:14px 0;padding:12px 14px;border-radius:10px;background:#ecfeff;border:1px solid #99f6e4">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#0f766e">
                      If anything is urgent, you can also reach us on WhatsApp at <strong>+91 96777 23429</strong>.
                    </p>
                  </div>
                  <div style="margin:14px 0 12px;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0">
                    <p style="margin:0 0 6px;font-size:12px;color:#64748b">Useful links</p>
                    <p style="margin:0;font-size:13px;line-height:1.7">
                      <a href="${WEBSITE_URL}" style="color:#0f766e;text-decoration:none;font-weight:600">Visit BudgetBoy</a>
                      <span style="color:#94a3b8"> · </span>
                      <a href="${WHATSAPP_URL}" style="color:#0f766e;text-decoration:none;font-weight:600">Chat on WhatsApp</a>
                    </p>
                  </div>
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#475569">Regards,<br/><strong>GodevsTeam</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function postContact(req: Request, ctx: ApiContext) {
  const guardError = enforceWriteGuard(req, ctx, "contact");
  if (guardError) return guardError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    ctx.log.warn("invalid_json");
    return jsonApiError(400, ApiErrorCodes.INVALID_JSON, "Request body must be valid JSON.", ctx.requestId);
  }

  const parsed = contactInquirySchema.safeParse(body);
  if (!parsed.success) {
    ctx.log.warn("contact_validation_failed", { issueCount: parsed.error.issues.length });
    return jsonApiError(400, ApiErrorCodes.VALIDATION_FAILED, "Contact request validation failed.", ctx.requestId, {
      zod: parsed.error.flatten(),
    });
  }

  const smtpUser = process.env.EMAIL_USER?.trim();
  const smtpPass = process.env.EMAIL_PASSWORD?.trim();
  if (!smtpUser || !smtpPass) {
    ctx.log.error("smtp_not_configured");
    return jsonApiError(
      500,
      ApiErrorCodes.SMTP_NOT_CONFIGURED,
      "Email sender is not configured. Set EMAIL_USER and EMAIL_PASSWORD.",
      ctx.requestId
    );
  }

  const { name, email, message } = parsed.data;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br/>");

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"BudgetBoy Contact" <${smtpUser}>`,
      to: "godevsteam@gmail.com",
      replyTo: email,
      subject: `New inquiry from ${name} (BudgetBoy Contact)`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: teamInquiryHtml(safeName, safeEmail, safeMessage),
    });

    let ackSent = true;
    try {
      await transporter.sendMail({
        from: `"GodevsTeam" <${smtpUser}>`,
        to: email,
        subject: "Thanks for contacting GodevsTeam",
        text: `Hi ${name},\n\nThanks for contacting us. We received your inquiry and will reply shortly.\n\nGodevsTeam`,
        html: userAcknowledgementHtml(safeName),
      });
    } catch (ackError) {
      ackSent = false;
      const ackErr = ackError instanceof Error ? ackError.message : "Failed to send acknowledgement";
      ctx.log.warn("contact_ack_failed", { err: ackErr, email });
    }

    ctx.log.info("contact_sent", { email, ackSent });
    return jsonSuccess(
      {
        success: true,
        message: ackSent ? "Inquiry sent successfully. Acknowledgement email delivered." : "Inquiry sent successfully.",
      },
      ctx.requestId,
      201
    );
  } catch (e) {
    const messageText = e instanceof Error ? e.message : "Failed to send contact email";
    ctx.log.error("contact_send_failed", { err: messageText });
    return jsonApiError(500, ApiErrorCodes.CONTACT_SEND_FAILED, "Failed to send inquiry email.", ctx.requestId);
  }
}
