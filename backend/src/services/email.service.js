const { Resend } = require('resend');
const AppError = require('../utils/AppError');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'ChantierPro <noreply@chantierpro.com>';
const APP_SCHEME = 'chantierpro';

/**
 * TEMP — Resend sandbox (remove when production domain is verified).
 * - TEST_EMAIL_OVERRIDE=true → always deliver to TEST_EMAIL_DELIVERY_TO.
 * - Resend rejects Gmail plus-addresses (user+tag@gmail.com) as “other recipients” even
 *   though Gmail treats them as one mailbox; if invitee is the same mailbox as
 *   TEST_EMAIL_DELIVERY_TO, we deliver to that canonical address without the flag.
 */
const TEST_EMAIL_OVERRIDE =
  process.env.TEST_EMAIL_OVERRIDE === 'true' || process.env.TEST_EMAIL_OVERRIDE === '1';
const TEST_EMAIL_DELIVERY_TO =
  (process.env.TEST_EMAIL_DELIVERY_TO || 'noreplychantierpro@gmail.com').trim();

/** @returns {{ local: string, domain: 'gmail.com' } | null} */
function gmailComparableParts(email) {
  const s = (email || '').trim().toLowerCase();
  const at = s.lastIndexOf('@');
  if (at < 0) return null;
  let local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') return null;
  const plus = local.indexOf('+');
  if (plus !== -1) local = local.slice(0, plus);
  return { local, domain: 'gmail.com' };
}

function isSameGmailMailboxAs(a, b) {
  const pa = gmailComparableParts(a);
  const pb = gmailComparableParts(b);
  if (!pa || !pb) return false;
  return pa.local === pb.local;
}

function resolveInvitationRecipient(intendedTo) {
  const originalTo = typeof intendedTo === 'string' ? intendedTo.trim() : intendedTo;
  if (TEST_EMAIL_OVERRIDE) {
    return {
      deliveryTo: TEST_EMAIL_DELIVERY_TO,
      originalTo,
      mode: 'TEST_EMAIL_OVERRIDE',
    };
  }
  if (isSameGmailMailboxAs(originalTo, TEST_EMAIL_DELIVERY_TO)) {
    return {
      deliveryTo: TEST_EMAIL_DELIVERY_TO,
      originalTo,
      mode: 'GMAIL_PLUS_SAME_MAILBOX',
    };
  }
  return { deliveryTo: originalTo, originalTo, mode: 'direct' };
}

// ─── Deep link ────────────────────────────────────────────────────────────
function buildInviteLink(token) {
  return `${APP_SCHEME}://invite/${token}`;
}

// ─── HTML Template ────────────────────────────────────────────────────────
function buildInviteEmail({ inviterName, companyName, role, inviteLink, expiresAt }) {
  const roleLabel = role === 'MANAGER' ? 'Chef de chantier' : 'Ouvrier';
  const expiryDate = new Date(expiresAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Invitation ChantierPro</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                🏗️ ChantierPro
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">
                Gestion de chantiers professionnelle
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 8px;font-size:24px;font-weight:600;color:#111827;letter-spacing:-0.3px;">
                Vous êtes invité(e) 🎉
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                <strong style="color:#374151;">${inviterName}</strong> vous invite à rejoindre
                <strong style="color:#374151;">${companyName}</strong> en tant que
                <strong style="color:#374151;">${roleLabel}</strong>.
              </p>

              <!-- Role badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 20px;">
                    <p style="margin:0;font-size:13px;color:#15803d;font-weight:500;">
                      ✅ Rôle assigné — ${roleLabel}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}"
                       style="display:inline-block;background:#1a1a2e;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.1px;">
                      Rejoindre l'équipe →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Manual link fallback -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">
                      Ou copiez ce lien manuellement
                    </p>
                    <p style="margin:0;font-size:12px;color:#374151;word-break:break-all;font-family:monospace;">
                      ${inviteLink}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
                ⏳ Cette invitation expire le <strong style="color:#6b7280;">${expiryDate}</strong>.
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} ChantierPro · Tous droits réservés
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Send invitation email ─────────────────────────────────────────────────
async function sendInvitationEmail({ to, inviterName, companyName, role, token, expiresAt }) {
  const { deliveryTo, originalTo, mode } = resolveInvitationRecipient(to);
  // #region agent log
  fetch('http://127.0.0.1:7376/ingest/d2026b59-fde2-4b44-b199-784e44ae48ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'404a50'},body:JSON.stringify({sessionId:'404a50',hypothesisId:'A',location:'email.service.js:sendInvitationEmail:env',message:'override env snapshot',data:{TEST_EMAIL_OVERRIDE,rawEnv:process.env.TEST_EMAIL_OVERRIDE??null,mode,deliveryTo,originalDomain:typeof originalTo==='string'?originalTo.split('@')[1]:null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7376/ingest/d2026b59-fde2-4b44-b199-784e44ae48ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'404a50'},body:JSON.stringify({sessionId:'404a50',hypothesisId:'D',location:'email.service.js:sendInvitationEmail:resend',message:'resend client state',data:{hasApiKey:Boolean(process.env.RESEND_API_KEY)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const inviteLink = buildInviteLink(token);

  const html = buildInviteEmail({
    inviterName,
    companyName,
    role,
    inviteLink,
    expiresAt,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: deliveryTo,
      subject: `${inviterName} vous invite à rejoindre ${companyName} sur ChantierPro`,
      html,
    });

    // #region agent log
    fetch('http://127.0.0.1:7376/ingest/d2026b59-fde2-4b44-b199-784e44ae48ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'404a50'},body:JSON.stringify({sessionId:'404a50',hypothesisId:'B',location:'email.service.js:sendInvitationEmail:afterResend',message:'resend.emails.send returned',data:{hasError:Boolean(error),errorSummary:error?String(error.message||JSON.stringify(error).slice(0,240)):null,resendId:data?.id??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error('[Email] Resend error:', error);
      throw new AppError('Failed to send invitation email', 500);
    }

    console.log(
      `[Email] Invitation | invitee (DB/token): ${originalTo} | delivered to: ${deliveryTo}${mode !== 'direct' ? ` [${mode}]` : ''} | id: ${data.id}`,
    );
    return data;
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7376/ingest/d2026b59-fde2-4b44-b199-784e44ae48ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'404a50'},body:JSON.stringify({sessionId:'404a50',hypothesisId:'B',location:'email.service.js:sendInvitationEmail:catch',message:'sendInvitationEmail threw',data:{errMessage:err?.message??String(err),statusCode:err?.statusCode??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // Don't crash the invitation flow if email fails
    // Log it and let the invitation be created anyway
    console.error('[Email] Send failed:', err.message);
    throw err;
  }
}

module.exports = {
  sendInvitationEmail,
};