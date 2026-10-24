// Sends email through a Google Apps Script web app on the shop's Gmail account, whose doPost checks
// MAIL_SCRIPT_SECRET and calls GmailApp.sendEmail. A plain HTTPS call, so it works where SMTP is blocked.
// Consumer Gmail allows about 100 emails a day this way.
import "server-only";

export async function sendMail(mail: { to: string; subject: string; html: string; text: string }) {
  const url = process.env.MAIL_SCRIPT_URL;
  const secret = process.env.MAIL_SCRIPT_SECRET;
  if (!url || !secret) throw new Error("MAIL_SCRIPT_URL and MAIL_SCRIPT_SECRET must be set");

  // Apps Script answers a POST with a redirect to the result; fetch follows it with a GET
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, ...mail }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!data?.ok) throw new Error(`Email not sent: ${data?.error ?? `HTTP ${res.status}`}`);
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// The one email layout: brand name, a heading, a short message and (optionally) a big code
function layout({ heading, message, code, footer }: { heading: string; message: string; code?: string; footer: string }) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FAF8F5;font-family:Arial,Helvetica,sans-serif;color:#1A1A18">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e5e4">
<tr><td style="padding:28px 32px 0;font-family:Georgia,serif;font-size:24px;letter-spacing:1px">Averto</td></tr>
<tr><td style="padding:20px 32px 0;font-family:Georgia,serif;font-size:22px;color:#111110">${escapeHtml(heading)}</td></tr>
<tr><td style="padding:12px 32px 0;font-size:15px;line-height:1.6;color:#44403c">${escapeHtml(message)}</td></tr>
${
  code
    ? `<tr><td style="padding:24px 32px 0"><div style="background:#F5F2EB;padding:18px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:10px;color:#111110">${escapeHtml(code)}</div></td></tr>`
    : ""
}
<tr><td style="padding:24px 32px 28px;font-size:13px;line-height:1.6;color:#78716c">${escapeHtml(footer)}</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function codeEmail(purpose: "signup" | "reset", code: string) {
  const signup = purpose === "signup";
  const heading = signup ? "Confirm your email" : "Reset your password";
  const message = signup
    ? "Enter this code on the Averto website to finish creating your account."
    : "Enter this code on the Averto website to choose a new password.";
  const footer =
    "The code works once and expires in 1 hour. If you didn't ask for it, you can ignore this email; nothing changes without the code.";
  return {
    subject: signup ? `${code} is your Averto code` : `${code} is your Averto password reset code`,
    html: layout({ heading, message, code, footer }),
    text: `${heading}\n\n${message}\n\n${code}\n\n${footer}`,
  };
}

// Sent instead of a code when someone registers with an email that already has an account
export function existingAccountEmail(siteUrl: string) {
  const message = `Someone (hopefully you) tried to create an Averto account with this email, but it already has one. Log in at ${siteUrl}/login, or use "Forgot password" there to set a new password.`;
  const footer = "If this wasn't you, you can ignore this email. Your account has not changed.";
  return {
    subject: "You already have an Averto account",
    html: layout({ heading: "You already have an account", message, footer }),
    text: `You already have an account\n\n${message}\n\n${footer}`,
  };
}

// Sent when the team moves a customer's return along (approved, pickup fixed, refunded…)
export function returnUpdateEmail(o: { ref: string; heading: string; message: string; siteUrl: string }) {
  const message = `${o.message} See the details at ${o.siteUrl}/account/orders/${o.ref}.`;
  const footer = `This is about your return for order ${o.ref}. Reply to this email or call us if anything is unclear.`;
  return {
    subject: `${o.heading} · order ${o.ref}`,
    html: layout({ heading: o.heading, message, footer }),
    text: `${o.heading}\n\n${message}\n\n${footer}`,
  };
}
