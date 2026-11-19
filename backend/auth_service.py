"""
ManganeseAI - Real Email OTP & Authentication Service
Handles user registration, PBKDF2 password hashing, OTP generation & hashing,
and SMTP email transmission using environment variables.
"""

import os
import sys
import json
import time
import secrets
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from typing import Dict, Any, Optional

# Load environment variables from .env if present in project root
try:
    from dotenv import load_dotenv
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(project_root, ".env"))
except ImportError:
    pass

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

USERS_FILE = os.path.join(DATA_DIR, "users.json")
PENDING_OTPS_FILE = os.path.join(DATA_DIR, "pending_otps.json")

# =========================================================
# DATABASE & STORAGE HELPERS
# =========================================================

def _load_json(file_path: str) -> dict:
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_json(file_path: str, data: dict):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def _init_users():
    users = _load_json(USERS_FILE)
    if not users:
        # Pre-seed analyst@manganese.ai with password 'manganese2026'
        default_email = "analyst@manganese.ai"
        default_pass_hash = hash_password("manganese2026")
        users[default_email] = {
            "user_id": "usr_analyst_001",
            "full_name": "Alex Morgan",
            "email": default_email,
            "password_hash": default_pass_hash,
            "role": "Mining Analyst",
            "email_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        _save_json(USERS_FILE, users)

# =========================================================
# PASSWORD & OTP SECURITY HELPERS
# =========================================================

def hash_password(password: str) -> str:
    """Hashes password using PBKDF2-HMAC-SHA256 with a 16-byte random salt."""
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}${key.hex()}"

_init_users()

def verify_password(password: str, stored_hash: str) -> bool:
    """Verifies password against stored PBKDF2 hash."""
    try:
        salt_hex, key_hex = stored_hash.split('$')
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return secrets.compare_digest(key, new_key)
    except Exception:
        return False

def generate_otp() -> str:
    """Generates a cryptographically secure 6-digit OTP string."""
    return str(secrets.randbelow(900000) + 100000)

def hash_otp(otp: str, salt: str) -> str:
    """Hashes OTP with salt using SHA-256."""
    return hashlib.sha256(f"{salt}:{otp}".encode('utf-8')).hexdigest()

# =========================================================
# REAL SMTP EMAIL TRANSMISSION
# =========================================================

def send_otp_email(to_email: str, otp: str, full_name: str) -> bool:
    """
    Transmits OTP verification email using SMTP environment variables.
    Fallback logs helpful message if SMTP credentials are missing.
    """
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USERNAME", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")
    email_from = os.getenv("EMAIL_FROM", f"ManganeseAI Security <{smtp_user or 'noreply@manganese.ai'}>")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ManganeseAI Verification Code</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        
        <!-- Brand Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 10px 16px; background-color: #0f172a; border-radius: 12px; margin-bottom: 8px;">
            <span style="font-size: 20px; font-weight: 900; color: #ffffff;">Manganese<span style="color: #3b82f6;">AI</span></span>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
            Mining Intelligence & Decision Support
          </div>
        </div>

        <div style="border-top: 1px solid #f1f5f9; margin-bottom: 24px;"></div>

        <!-- Greeting & Message -->
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 8px;">Verify Your Email Address</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-top: 0;">
          Hello <strong>{full_name}</strong>,
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Thank you for registering with ManganeseAI. Please use the 6-digit verification code below to complete your account setup. This code is valid for <strong>5 minutes</strong>.
        </p>

        <!-- OTP Code Display -->
        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #2563eb; background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 14px 28px; border-radius: 12px;">
            {otp}
          </div>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          If you did not request this registration code, please disregard this email.
        </p>

        <div style="border-top: 1px solid #f1f5f9; margin-top: 32px; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          &copy; 2026 ManganeseAI Mining Intelligence Engine - Confidential Information
        </div>
      </div>
    </body>
    </html>
    """

    print(f"\n========================================================")
    print(f"  [ManganeseAI Email Engine] OTP Generated for {to_email}")
    print(f"  --> OTP CODE: {otp}")
    print(f"========================================================\n")

    if not (smtp_host and smtp_user and smtp_pass):
        print(f"[SMTP Warning] SMTP host/user/pass not fully configured in .env.")
        print(f"               Using logged OTP code above for local development verification.")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your ManganeseAI Verification Code: {otp}"
        msg["From"] = email_from
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(email_from, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(email_from, [to_email], msg.as_string())

        print(f"[SMTP Success] Email successfully transmitted to {to_email} via {smtp_host}")
        return True
    except Exception as e:
        print(f"[SMTP Error] Failed to send email via {smtp_host}:{smtp_port}: {e}")
        return False

# =========================================================
# DIRECT REGISTRATION & AUTHENTICATION WORKFLOWS
# =========================================================

def register_user(full_name: str, email: str, password: str, role: str = "Mining Analyst") -> dict:
    """Directly creates a verified user account with PBKDF2 hashed password."""
    email_clean = email.strip().lower()
    
    users = _load_json(USERS_FILE)
    if email_clean in users:
        raise ValueError("This email address is already registered. Please sign in instead.")

    pass_hash = hash_password(password)
    user_id = f"usr_{secrets.token_hex(6)}"

    users[email_clean] = {
        "user_id": user_id,
        "full_name": full_name.strip(),
        "email": email_clean,
        "password_hash": pass_hash,
        "role": role or "Mining Analyst",
        "email_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    _save_json(USERS_FILE, users)

    return {
        "status": "success",
        "message": "Account created successfully! Logging you in...",
        "user": {
            "user_id": user_id,
            "email": email_clean,
            "name": full_name.strip(),
            "role": role or "Mining Analyst"
        }
    }

def login_user(email: str, password: str) -> dict:
    """Authenticates user with registered email & password."""
    email_clean = email.strip().lower()
    users = _load_json(USERS_FILE)

    if email_clean not in users:
        raise ValueError("Invalid email or password.")

    user = users[email_clean]
    if not verify_password(password, user["password_hash"]):
        raise ValueError("Invalid email or password.")

    return {
        "status": "success",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["full_name"],
            "role": user["role"]
        }
    }
