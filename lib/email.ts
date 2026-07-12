import "server-only";

/**
 * Envio de e-mail via Resend (API REST — sem dependência extra).
 *
 * Fica inerte se RESEND_API_KEY não estiver definida: o convite continua
 * valendo no sistema, só não avisa a pessoa por e-mail. Nunca derruba a ação.
 */

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://trackify-ebon.vercel.app";

const FROM = process.env.RESEND_FROM ?? "Trackify <onboarding@resend.dev>";

export type EmailResult = { sent: boolean; error?: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inviteHtml(workspaceName: string, email: string): string {
  const ws = escapeHtml(workspaceName);
  const mail = escapeHtml(email);

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f1f5f9;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#212A3A;padding:20px 24px;">
      <span style="color:#fff;font-size:20px;font-weight:700;">Trackify</span>
    </div>

    <div style="padding:24px;">
      <h1 style="margin:0 0 12px;font-size:18px;color:#0f172a;">
        Você foi convidado para o <span style="color:#03A9F4;">${ws}</span>
      </h1>

      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
        Para começar a registrar seu tempo de trabalho, acesse o Trackify e
        <strong>crie sua conta usando exatamente este e-mail</strong>:
      </p>

      <p style="margin:0 0 20px;padding:10px 14px;background:#f1f5f9;border-radius:8px;
                font-size:14px;font-weight:600;color:#0f172a;">
        ${mail}
      </p>

      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
        Ao se cadastrar com esse endereço, você entra automaticamente no
        <strong>${ws}</strong> e passa a ver os projetos da equipe.
      </p>

      <a href="${APP_URL}/signup"
         style="display:inline-block;background:#03A9F4;color:#fff;text-decoration:none;
                padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">
        Criar minha conta
      </a>

      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
        Ou copie e cole este endereço no navegador:<br />
        <a href="${APP_URL}" style="color:#03A9F4;">${APP_URL}</a>
      </p>
    </div>

    <div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        Se você não esperava este convite, pode ignorar este e-mail.
      </p>
    </div>
  </div>
</div>`.trim();
}

export async function sendInviteEmail(
  to: string,
  workspaceName: string
): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { sent: false, error: "RESEND_API_KEY não configurada." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: `Você foi convidado para o ${workspaceName} no Trackify`,
        html: inviteHtml(workspaceName, to),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { sent: false, error: `Resend ${res.status}: ${body.slice(0, 180)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Falha no envio." };
  }
}
