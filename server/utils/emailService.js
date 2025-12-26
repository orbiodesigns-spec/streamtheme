require('dotenv').config();
const nodemailer = require('nodemailer');

// --- LOGGING ---
function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
}

// --- EMAIL SETUP ---
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendVerificationEmail(email, verificationToken) {
    const verifyLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
        from: `"StreamTheme" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email - StreamTheme',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                <div style="background-color: #000; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: #fff; margin-bottom: 20px;">Welcome to StreamTheme!</h1>
                    <p style="color: #ccc; font-size: 16px; margin-bottom: 30px;">
                        Please verify your email address to activate your account and start your 24-hour free trial.
                    </p>
                    <a href="${verifyLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        Verify Email
                    </a>
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        Or copy this link: <br>
                        <span style="color: #3b82f6;">${verifyLink}</span>
                    </p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">
                        If you didn't create this account, please ignore this email.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        log(`✓ Verification email sent to ${email}`, 'INFO');
        return true;
    } catch (error) {
        log(`✗ Failed to send email to ${email}: ${error.message}`, 'ERROR');
        return false;
    }
}

async function sendTrialStartedEmail(email, name, expiryDate) {
    const formattedDate = new Date(expiryDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const mailOptions = {
        from: `"StreamTheme" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your 24-Hour Free Trial Has Started! - StreamTheme',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #121212; color: #ffffff;">
                <div style="text-align: center; padding: 30px; border: 1px solid #333; border-radius: 10px; background-color: #1e1e1e;">
                    <h1 style="color: #4ade80; margin-bottom: 20px;">Trial Activated! 🚀</h1>
                    <p style="color: #cccccc; font-size: 16px; margin-bottom: 30px;">
                        Hi <strong>${name}</strong>,<br><br>
                        Your 24-hour free trial for StreamTheme Pro is now active. You have full access to all premium layouts and features.
                    </p>
                    <div style="background-color: #333; padding: 15px; border-radius: 5px; margin-bottom: 30px;">
                        <p style="margin: 0; color: #888; font-size: 14px;">Trial Expires On</p>
                        <p style="margin: 5px 0 0 0; color: #ffffff; font-weight: bold; font-size: 18px;">${formattedDate}</p>
                    </div>
                    <a href="${process.env.CLIENT_URL}/dashboard" style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        Go to Dashboard
                    </a>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        Need help? Reply to this email.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        log(`✓ Trial Started email sent to ${email}`, 'INFO');
        return true;
    } catch (error) {
        log(`✗ Failed to send Trial email to ${email}: ${error.message}`, 'ERROR');
        return false;
    }
}

async function sendSubscriptionActivatedEmail(email, name, planName, expiryDate, amount) {
    const formattedDate = new Date(expiryDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const mailOptions = {
        from: `"StreamTheme" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Payment Successful! Welcome to StreamTheme Pro - StreamTheme',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #121212; color: #ffffff;">
                <div style="text-align: center; padding: 30px; border: 1px solid #333; border-radius: 10px; background-color: #1e1e1e;">
                    <h1 style="color: #4ade80; margin-bottom: 10px;">Payment Successful! 🎉</h1>
                    <p style="color: #4ade80; font-size: 24px; font-weight: bold; margin-bottom: 20px;">₹${amount}</p>
                    
                    <p style="color: #cccccc; font-size: 16px; margin-bottom: 30px;">
                        Hi <strong>${name}</strong>,<br>
                        Thank you for subscribing to <strong>${planName}</strong>. Your account has been upgraded successfully.
                    </p>

                    <div style="background-color: #333; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: left;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #888;">Plan</span>
                            <span style="color: white; font-weight: bold;">${planName}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #888;">Valid Until</span>
                            <span style="color: white; font-weight: bold;">${formattedDate}</span>
                        </div>
                    </div>

                    <a href="${process.env.CLIENT_URL}/dashboard" style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        Access Premium Dashboard
                    </a>
                </div>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        log(`✓ Subscription Activated email sent to ${email}`, 'INFO');
        return true;
    } catch (error) {
        log(`✗ Failed to send Subscription email to ${email}: ${error.message}`, 'ERROR');
        return false;
    }
}

async function sendPasswordResetEmail(email, resetToken) {
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"StreamTheme" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password - StreamTheme',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #121212; color: #ffffff;">
                <div style="text-align: center; padding: 30px; border: 1px solid #333; border-radius: 10px; background-color: #1e1e1e;">
                    <h1 style="color: #60a5fa; margin-bottom: 20px;">Reset Password 🔒</h1>
                    <p style="color: #cccccc; font-size: 16px; margin-bottom: 30px;">
                        You requested a password reset. Click the button below to set a new password.
                    </p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        Reset Password
                    </a>
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">
                        Or copy this link: <br>
                        <span style="color: #3b82f6; word-break: break-all;">${resetLink}</span>
                    </p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        Link expires in 1 hour. If you didn't request this, please ignore this email.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        log(`✓ Reset Password email sent to ${email}`, 'INFO');
        return true;
    } catch (error) {
        log(`✗ Failed to send Reset email to ${email}: ${error.message}`, 'ERROR');
        return false;
    }
}

module.exports = { sendVerificationEmail, sendTrialStartedEmail, sendSubscriptionActivatedEmail, sendPasswordResetEmail };
