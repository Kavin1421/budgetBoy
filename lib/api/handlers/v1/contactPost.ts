import nodemailer from "nodemailer";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { enforceWriteGuard } from "@/lib/api/guards";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";
import { contactInquirySchema } from "@/utils/validators";

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
          <h2 style="margin:0 0 12px 0;">New BudgetBoy Contact Inquiry</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong></p>
          <div style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc">${safeMessage}</div>
        </div>
      `,
    });

    ctx.log.info("contact_sent", { email });
    return jsonSuccess({ success: true, message: "Inquiry sent successfully." }, ctx.requestId, 201);
  } catch (e) {
    const messageText = e instanceof Error ? e.message : "Failed to send contact email";
    ctx.log.error("contact_send_failed", { err: messageText });
    return jsonApiError(500, ApiErrorCodes.CONTACT_SEND_FAILED, "Failed to send inquiry email.", ctx.requestId);
  }
}
