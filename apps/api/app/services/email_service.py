import logging

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from jinja2 import Template

from ..core.config import settings

logger = logging.getLogger(__name__)


class EmailService:

    def __init__(self) -> None:
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
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[to_email],
                body=html_body,
                subtype=MessageType.html,
            )

            if text_body:
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6; 
                    color: #333333; 
                    background-color: #f5f5f5;
                    padding: 20px;
                }
                .email-wrapper {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border: 2px solid #d4e6f1;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .logo-section {
                    padding: 24px 24px 16px 24px;
                    border-bottom: 1px solid #e0e0e0;
                    background-color: #ffffff;
                }
                .logo {
                    font-size: 28px;
                    font-weight: 700;
                    color: #003087;
                    margin-bottom: 8px;
                }
                .main-heading {
                    font-size: 20px;
                    font-weight: 600;
                    color: #333333;
                    margin: 24px 24px 16px 24px;
                    line-height: 1.4;
                }
                .content { 
                    padding: 0 24px 24px 24px; 
                    background-color: #ffffff;
                }
                .content p {
                    color: #555555;
                    margin-bottom: 16px;
                    font-size: 15px;
                    line-height: 1.6;
                }
                .instructions {
                    color: #333333;
                    margin: 20px 0;
                    font-size: 15px;
                }
                .button-container {
                    text-align: center;
                    margin: 32px 0;
                }
                .button { 
                    display: inline-block; 
                    padding: 14px 40px; 
                    background-color: #003087; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: 600;
                    font-size: 16px;
                    transition: background-color 0.2s;
                }
                .button:hover { 
                    background-color: #1e3a8a; 
                }
                a[href] {
                    color: #3073e9;
                    text-decoration: underline;
                }
                .button {
                    color: white !important;
                    text-decoration: none !important;
                }
                .security-notice { 
                    background-color: #fff9e6; 
                    border: 1px solid #ffd700; 
                    border-left: 4px solid #f59e0b; 
                    padding: 16px; 
                    margin: 24px 0;
                    border-radius: 4px;
                }
                .security-notice strong {
                    color: #92400e;
                    display: block;
                    margin-bottom: 8px;
                    font-size: 14px;
                }
                .security-notice ul {
                    margin: 8px 0 0 20px;
                    color: #78350f;
                    font-size: 14px;
                }
                .security-notice li {
                    margin-bottom: 6px;
                }
                .support-note {
                    margin-top: 24px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    color: #666666;
                    font-size: 14px;
                }
                .footer { 
                    padding: 20px 24px; 
                    text-align: center; 
                    font-size: 12px; 
                    color: #999999;
                    background-color: #f9f9f9;
                    border-top: 1px solid #e0e0e0;
                }
                .footer p {
                    margin: 4px 0;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="logo-section">
                    <div class="logo">SmartFAQ</div>
                </div>
                
                <div class="main-heading">
                    We received your password reset request.
                </div>
                
                <div class="content">
                    <p>Hello <strong>{{ username }}</strong>,</p>
                    
                    <p class="instructions">
                        If you forgot your password, click <strong>Reset Password</strong> below and follow the onscreen instructions. The reset link expires in 1 hour.
                    </p>
                    
                    <div class="button-container">
                        <a href="{{ reset_url }}" class="button">Reset Password</a>
                    </div>
                    
                    <div class="security-notice">
                        <strong>⚠️ Security Notice:</strong>
                        <ul>
                            <li>This link will expire in 1 hour</li>
                            <li>If you did not request this reset, please ignore this email</li>
                            <li>Do not share this link with anyone</li>
                        </ul>
                    </div>
                    
                    <p class="support-note">
                        If you didn't make this request, please contact SmartFAQ Support.
                    </p>
                </div>
                                <div class="footer">
                    <p>Please do not reply to this message. If you have any questions, please contact SmartFAQ Support.</p>
                    <p>&copy; 2025 SmartFAQ System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        template = Template(html_template)
        html_body = template.render(username=username, reset_url=reset_url)

        return await self.send_email(to_email, subject, html_body, text_body=None)
