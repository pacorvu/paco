import smtplib
import sys
import os

def send_email(to_email, otp, from_email, from_password):
    """
    Connects to the Gmail SMTP server and sends a one-time password.
    """
    s = None
    try:
        # Create an SMTP session with timeout (15 seconds)
        s = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
        s.starttls()  # Start TLS for security

        # Login to your email account using the app password
        s.login(from_email, from_password)

        # Extract username from email for display name
        email_username = from_email.split('@')[0] if '@' in from_email else 'User'
        display_name = email_username.capitalize()

        # Prepare the message
        message = f"""From: {display_name} <{from_email}>
To: {to_email}
Subject: Your One-Time Password (OTP)

Your OTP is: {otp}

This code will expire in 10 minutes.
"""

        # Send the email
        s.sendmail(from_email, to_email, message)
        print("Email sent successfully.")  # This output can be seen by the Node.js server

    except smtplib.SMTPAuthenticationError:
        print("Authentication error: Check your GMAIL_USER and GMAIL_APP_PASS in the .env file.", file=sys.stderr)
        sys.exit(1)
    except (OSError, ConnectionError) as e:
        # Handle network errors (unreachable, connection refused, etc.)
        error_msg = str(e)
        if 'Network is unreachable' in error_msg or '101' in error_msg:
            print(f"Network error: Cannot reach SMTP server. Please check your network connection or firewall settings.", file=sys.stderr)
        elif 'Connection refused' in error_msg or '111' in error_msg:
            print(f"Connection error: SMTP server refused connection. Port 587 may be blocked.", file=sys.stderr)
        else:
            print(f"Network error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred while sending email: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        # Only try to quit if SMTP connection was successfully established
        if s is not None:
            try:
                s.quit()
            except Exception:
                # Ignore errors when closing - connection may already be closed
                pass

# This block runs when the script is executed directly from the command line
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python send_otp_email.py <recipient_email> <otp>", file=sys.stderr)
        sys.exit(1)
        
    to_email = sys.argv[1]
    otp = sys.argv[2]
    
    # Get credentials securely from environment variables
    from_email = os.getenv('GMAIL_USER')
    from_password = os.getenv('GMAIL_APP_PASS')
    
    if not from_email or not from_password:
        print("Fatal: GMAIL_USER or GMAIL_APP_PASS are not set in environment variables.", file=sys.stderr)
        sys.exit(1)
        
    send_email(to_email, otp, from_email, from_password)

