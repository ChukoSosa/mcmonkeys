import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "MC Monkeys <noreply@mcmonkeys.up.railway.app>";
const ADMIN_EMAIL = process.env.BUGS_ADMIN_EMAIL ?? "billy.mcmonkeys@gmail.com";

export async function sendBugConfirmation(opts: {
  to: string;
  name: string;
  description: string;
  bugId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "We received your bug report – MC Monkeys",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b">
        <h2 style="color:#06b6d4">Bug report received</h2>
        <p>Hi ${opts.name},</p>
        <p>We got your report and we're on it. Every bug you flag helps us build something better.</p>
        <blockquote style="border-left:3px solid #06b6d4;padding-left:12px;color:#475569;margin:16px 0">
          ${opts.description.slice(0, 300)}${opts.description.length > 300 ? "…" : ""}
        </blockquote>
        <p style="color:#64748b;font-size:13px">Reference: ${opts.bugId}</p>
        <p>If you want to follow up, write to us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.</p>
        <p style="color:#64748b;font-size:12px;margin-top:32px">— The MC Monkeys team</p>
      </div>
    `,
  });
}

export async function sendBugResolved(opts: {
  to: string;
  name: string;
  resolution: string;
  bugId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Your bug report has been fixed – MC Monkeys",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b">
        <h2 style="color:#06b6d4">Bug fixed ✓</h2>
        <p>Hi ${opts.name},</p>
        <p>The bug you reported has been fixed and deployed.</p>
        ${opts.resolution ? `<blockquote style="border-left:3px solid #22c55e;padding-left:12px;color:#475569;margin:16px 0">${opts.resolution}</blockquote>` : ""}
        <p style="color:#64748b;font-size:13px">Reference: ${opts.bugId}</p>
        <p>Thanks for helping us improve. If you spot something new, don't hesitate to report it again.</p>
        <p style="color:#64748b;font-size:12px;margin-top:32px">— The MC Monkeys team</p>
      </div>
    `,
  });
}

export async function notifyAdminNewBug(opts: {
  name: string;
  email: string;
  description: string;
  bugId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New bug report from ${opts.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b">
        <h2 style="color:#f59e0b">New bug report</h2>
        <p><strong>From:</strong> ${opts.name} &lt;${opts.email}&gt;</p>
        <p><strong>ID:</strong> ${opts.bugId}</p>
        <blockquote style="border-left:3px solid #f59e0b;padding-left:12px;color:#475569;margin:16px 0">
          ${opts.description}
        </blockquote>
      </div>
    `,
  });
}
