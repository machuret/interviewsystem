/**
 * Transactional email helpers via Resend.
 * All functions fail gracefully if RESEND_API_KEY is not set.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = process.env.RESEND_FROM_EMAIL ?? "RapidTal <noreply@rapidtal.com>";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? "hello@rapidtal.com";

async function send(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return; // graceful no-op when not configured
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
  } catch {
    // Never let email failure break the request
  }
}

export async function sendCandidateConfirmation(
  to: string,
  firstName: string,
  roleName: string
) {
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#f97316">Application received 🎉</h2>
      <p>Hi ${firstName},</p>
      <p>We've received your application for the <strong>${roleName}</strong> position at RapidTal. Well done on passing the screening!</p>
      <p>Our team reviews applications within <strong>3–5 business days</strong>. If you're a strong fit, we'll reach out with next steps.</p>
      <p style="color:#666;font-size:13px">Questions? Reply to this email or contact us at hello@rapidtal.com</p>
      <p>Good luck!<br/>The RapidTal Team</p>
    </div>`;
  await send(to, `Your RapidTal application for ${roleName}`, html);
}

export async function sendAdminNewApplication(
  candidateName: string,
  roleName: string,
  candidateEmail: string,
  score: number | null
) {
  const scoreText = score != null ? `${score}/10` : "not recorded";
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#f97316">New application 📥</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#666;width:140px">Candidate</td><td><strong>${candidateName}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666">Email</td><td>${candidateEmail}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Role</td><td>${roleName}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Quiz score</td><td>${scoreText}</td></tr>
      </table>
      <p><a href="https://apply.rapidtal.com/admin" style="color:#f97316">View in admin →</a></p>
    </div>`;
  await send(ADMIN_EMAIL, `New application: ${candidateName} — ${roleName}`, html);
}

export async function sendShortlistEmail(
  to: string,
  firstName: string,
  roleName: string
) {
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:#f97316">Great news — you've been shortlisted! 🌟</h2>
      <p>Hi ${firstName},</p>
      <p>We're excited to let you know that your application for the <strong>${roleName}</strong> position has been shortlisted!</p>
      <p>We'd love to schedule a short interview to learn more about you. Please reply to this email with your availability over the next few days and we'll lock in a time.</p>
      <p>Talk soon,<br/>The RapidTal Team</p>
    </div>`;
  await send(to, `You've been shortlisted — ${roleName} at RapidTal`, html);
}

export async function sendRejectionEmail(
  to: string,
  firstName: string,
  roleName: string,
  reason?: string | null
) {
  const reasonLine = reason
    ? `<p style="color:#666;font-size:13px">Feedback: ${reason}</p>`
    : "";
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
      <h2>Thank you for applying</h2>
      <p>Hi ${firstName},</p>
      <p>Thank you for taking the time to apply for the <strong>${roleName}</strong> position at RapidTal. We genuinely appreciate the effort you put in.</p>
      <p>After careful review, we've decided to move forward with other candidates who more closely match our current requirements. This doesn't reflect on your abilities — it's simply a matter of fit at this time.</p>
      ${reasonLine}
      <p>We receive new roles regularly and encourage you to check back in the future.</p>
      <p>All the best,<br/>The RapidTal Team</p>
    </div>`;
  await send(to, `Your RapidTal application update`, html);
}
