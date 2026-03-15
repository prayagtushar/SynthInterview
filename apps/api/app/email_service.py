import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)

def _smtp_configured() -> bool:
    return bool(
        os.getenv("SMTP_HOST") and
        os.getenv("SMTP_USER") and
        os.getenv("SMTP_PASS")
    )


async def send_invite_email(
    to_email: str,
    session_id: str,
    difficulty: str,
    topics: list,
) -> bool:
    """Sends interview invitation email."""
    if not _smtp_configured():
        logger.warning("SMTP not configured — skipping invite email to %s", to_email)
        return False

    session_link = f"{os.getenv('APP_URL', 'http://localhost:3000')}/session?id={session_id}"
    topics_str = ", ".join(topics) if topics else "General Algorithms"

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;">

        <tr>
          <td style="background:#000;padding:28px 36px;border-bottom:1px solid #222;">
            <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:-0.5px;color:#fff;">
              SYNTH<span style="color:#555;">INTERVIEW</span>
            </p>
            <p style="margin:4px 0 0;font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#555;">
              Technical Interview Platform
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:36px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">
              Your interview session is ready.
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#888;line-height:1.6;">
              Click the button below to begin your technical interview. The link is valid for <strong style="color:#ccc;">60 minutes</strong> from when you click it.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #222;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#555;padding-bottom:4px;">Difficulty</td>
                      <td style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#555;padding-bottom:4px;">Topics</td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;font-weight:700;color:#fff;">{difficulty}</td>
                      <td style="font-size:14px;font-weight:700;color:#fff;">{topics_str}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fff;border-radius:8px;">
                  <a href="{session_link}" style="display:inline-block;padding:14px 32px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#000;text-decoration:none;">
                    Start Interview
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 6px;font-size:11px;color:#555;">Or copy this link:</p>
            <p style="margin:0 0 28px;font-size:11px;color:#666;word-break:break-all;background:#0a0a0a;padding:10px 14px;border-radius:6px;border:1px solid #1a1a1a;">
              {session_link}
            </p>

            <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#555;">Before you start</p>
            <ul style="margin:0;padding-left:18px;font-size:13px;color:#888;line-height:2;">
              <li>Have a code editor or use the built-in Monaco editor</li>
              <li>Ensure your microphone is working</li>
              <li>Be prepared to share your entire screen</li>
              <li>Find a quiet environment with no distractions</li>
            </ul>
          </td>
        </tr>

        <tr>
          <td style="background:#0a0a0a;padding:16px 36px;border-top:1px solid #1a1a1a;text-align:center;">

            <p style="margin:0;font-size:10px;color:#444;text-transform:uppercase;letter-spacing:2px;">
              SynthInterview &mdash; AI-Powered Technical Interviews
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
""".strip()

    return await _send(
        to_email=to_email,
        subject="Your SynthInterview Session is Ready",
        html=html,
    )


async def send_scorecard_email(
    to_email: str,
    scorecard: dict,
    question_title: str,
    final_code: str,
    language: str = "python",
) -> bool:
    """Sends post-interview scorecard email."""
    if not _smtp_configured():
        logger.warning("SMTP not configured — skipping scorecard email to %s", to_email)
        return False

    scores = scorecard.get("scores", {})
    overall = scorecard.get("overall_score", 0)
    rating = scorecard.get("rating", "Needs Improvement")
    feedback = scorecard.get("feedback", "")
    dimension_feedback = scorecard.get("dimension_feedback", {})

    rating_color = {
        "Excellent": "#22c55e",
        "Good": "#3b82f6",
        "Needs Improvement": "#f59e0b",
        "Needs Significant Practice": "#ef4444",
    }.get(rating, "#888")

    def score_bar(score: int) -> str:
        pct = min(100, max(0, score))
        color = "#22c55e" if pct >= 70 else "#f59e0b" if pct >= 40 else "#ef4444"
        return f"""
        <div style="background:#1a1a1a;border-radius:4px;height:6px;margin-top:6px;overflow:hidden;">
          <div style="background:{color};height:100%;width:{pct}%;border-radius:4px;"></div>
        </div>"""

    dimension_rows = ""
    dim_labels = {
        "problem_understanding": "Problem Understanding",
        "approach": "Approach & Algorithm",
        "communication": "Communication",
        "code_quality": "Code Quality",
        "correctness": "Correctness",
        "time_management": "Time Management",
    }
    for key, label in dim_labels.items():
        s = scores.get(key, 0)
        fb = dimension_feedback.get(key, "")
        dimension_rows += f"""
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid #1a1a1a;vertical-align:top;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:600;color:#ccc;">{label}</span>
              <span style="font-size:13px;font-weight:700;color:#fff;">{s}/100</span>
            </div>
            {score_bar(s)}
            {"<p style='margin:6px 0 0;font-size:11px;color:#666;line-height:1.5;'>" + fb + "</p>" if fb else ""}
          </td>
        </tr>"""

    code_snippet = final_code[-1500:] if len(final_code) > 1500 else final_code
    code_escaped = code_snippet.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:12px;overflow:hidden;">

        <tr>
          <td style="background:#000;padding:28px 36px;border-bottom:1px solid #222;">
            <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:-0.5px;color:#fff;">
              SYNTH<span style="color:#555;">INTERVIEW</span>
            </p>
            <p style="margin:4px 0 0;font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#555;">
              Interview Scorecard
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 36px;border-bottom:1px solid #1a1a1a;text-align:center;">
            <div style="display:inline-block;width:90px;height:90px;border-radius:50%;border:3px solid {rating_color};line-height:84px;font-size:28px;font-weight:900;color:#fff;margin-bottom:12px;">
              {overall}
            </div>
            <p style="margin:0;font-size:16px;font-weight:700;color:#fff;">{rating}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#666;">Overall Score &mdash; {question_title}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:0;">
            <p style="margin:20px 36px 8px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#555;">Score Breakdown</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              {dimension_rows}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 36px;border-top:1px solid #1a1a1a;">
            <p style="margin:0 0 10px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#555;">Interviewer Feedback</p>
            <p style="margin:0;font-size:13px;color:#aaa;line-height:1.7;">{feedback}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px 24px;">
            <p style="margin:0 0 10px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#555;">Your Submission ({language})</p>
            <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;padding:16px;overflow:auto;">
              <pre style="margin:0;font-size:11px;font-family:'JetBrains Mono',Menlo,monospace;color:#7dd3fc;white-space:pre-wrap;word-break:break-word;">{code_escaped}</pre>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#0a0a0a;padding:16px 36px;border-top:1px solid #1a1a1a;text-align:center;">

            <p style="margin:0;font-size:10px;color:#444;text-transform:uppercase;letter-spacing:2px;">
              SynthInterview &mdash; AI-Powered Technical Interviews
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
""".strip()

    return await _send(
        to_email=to_email,
        subject=f"Your SynthInterview Scorecard — {question_title}",
        html=html,
    )


async def _send(to_email: str, subject: str, html: str) -> bool:
    """SMTP send via aiosmtplib."""
    try:
        import aiosmtplib

        smtp_host = os.getenv("SMTP_HOST", "")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASS", "")
        email_from = os.getenv("EMAIL_FROM", "") or smtp_user

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = email_from
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        await aiosmtplib.send(
            msg,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_pass,
            start_tls=True,
        )
        logger.info("Email sent to %s: %s", to_email, subject)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
        return False
