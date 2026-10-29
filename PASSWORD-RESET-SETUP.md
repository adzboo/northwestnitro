# Password recovery setup

1. Deploy the password recovery update to Netlify.
2. In Netlify environment variables, set SITE_URL to https://nwnlive.netlify.app (or your current primary custom domain), available to production Functions. Redeploy if changed.
3. In Supabase Authentication > URL Configuration, set Site URL to that same address. Add https://nwnlive.netlify.app/reset-password to Redirect URLs, using your actual domain if different.
4. In Authentication > Emails > Reset password, set the subject to "Reset your North West Nitro password" and use this HTML:

```html
<h2>Reset your North West Nitro password</h2>
<p>Follow the link below to choose a new password.</p>
<p><a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}">Reset password</a></p>
<p>If you did not request this, ignore this email. Your password has not changed.</p>
```

Use this custom token-hash link, not the default ConfirmationURL. The website verifies it as a recovery token on an explicit Continue button press, not a GET request. Keep email click tracking off for recovery emails.

5. Keep Confirm email disabled in Authentication > Sign In / Providers > Email to retain the existing registration-without-confirmation flow. Password recovery emails are separate.
6. For delivery to real members, configure Authentication > Emails > SMTP Settings with your email provider's verified sender address, sender name "North West Nitro", host, port, SMTP username and SMTP password. These are email-provider credentials, not the Supabase database password. Verify the sending domain and DNS records required by your provider. Without custom SMTP, the built-in service only sends to project organization team addresses and is rate-limited, so use it only for initial testing.
7. Test using an existing account whose inbox you control: sign out, open /login, choose Forgot password?, request a link, open the email, press Continue password reset, enter matching passwords of at least 12 characters, save, and sign in with the new password. Verify the old password fails and membership/administrator access remains unchanged. Reusing the old recovery link should fail. Request a fresh link if it expires.

No database schema changes or service-role key are needed. Never paste reset tokens or SMTP passwords into support messages. When moving domains, update Netlify SITE_URL, Supabase Site URL and Redirect URLs, then redeploy and test again.

References:
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
