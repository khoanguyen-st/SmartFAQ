import logging

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from jinja2 import Template

from ..core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails using fastapi-mail."""

    def __init__(self) -> None:
        """Initialize email service with configuration."""
        self.conf = ConnectionConfig(
            MAIL_USERNAME=settings.MAIL_USERNAME,
            MAIL_PASSWORD=settings.MAIL_PASSWORD,
            MAIL_FROM=settings.MAIL_FROM,
            MAIL_PORT=settings.MAIL_PORT,
            MAIL_SERVER=settings.MAIL_SERVER,
            MAIL_STARTTLS=settings.MAIL_STARTTLS,
            MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
            USE_CREDENTIALS=settings.MAIL_USE_CREDENTIALS,
            VALIDATE_CERTS=True,
        )
        self.fastmail = FastMail(self.conf)

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> bool:
        """Send email using fastapi-mail."""
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[to_email],
                body=html_body,
                subtype=MessageType.html,
            )

            if text_body:
                # Add text alternative
                message.body = f"{text_body}\n\n---\n{html_body}"
                message.subtype = MessageType.html

            await self.fastmail.send_message(message)
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {e}", exc_info=True)
            return False

    async def send_password_reset_email(
        self, to_email: str, reset_token: str, username: str
    ) -> bool:
        """Send password reset email with secure token link."""
        reset_url = f"{settings.FRONTEND_RESET_PASSWORD_URL}?token={reset_token}"

        subject = "Password Reset Request - SmartFAQ"

        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; 
                          color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .button:hover { background-color: #45a049; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; 
                           padding: 10px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SmartFAQ Password Reset</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>{{ username }}</strong>,</p>
                    <p>You have requested to reset your password for your SmartFAQ account.</p>
                    <p>Click the button below to reset your password:</p>
                    <p style="text-align: center;">
                        <a href="{{ reset_url }}" class="button">Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #0066cc;">{{ reset_url }}</p>
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong>
                        <ul>
                            <li>This link will expire in 1 hour</li>
                            <li>If you did not request this reset, please ignore this email</li>
                            <li>Do not share this link with anyone</li>
                        </ul>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply.</p>
                    <p>&copy; 2025 SmartFAQ System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        SmartFAQ Password Reset Request

        Hello {username},

        You have requested to reset your password for your SmartFAQ account.

        Click the link below to reset your password:
        {reset_url}

        Security Notice:
        - This link will expire in 1 hour
        - If you did not request this reset, please ignore this email
        - Do not share this link with anyone

        This is an automated email. Please do not reply.

        © 2025 SmartFAQ System. All rights reserved.
        """

        # Render HTML template
        template = Template(html_template)
        html_body = template.render(username=username, reset_url=reset_url)

        return await self.send_email(to_email, subject, html_body, text_body)
