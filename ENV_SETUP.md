# Environment Variables Setup for Email Notifications

To enable email notifications with CC to Max, configure the following environment variables in DigitalOcean App Platform:

## Required Variables

1. **EMAIL_USER** - The email address to send from
   - Example: `noreply@sheragency.com`
   - Default: `noreply@sheragency.com`

2. **EMAIL_PASSWORD** - SMTP password for the email account
   - Required for email functionality
   - Set as encrypted environment variable in DigitalOcean

3. **EMAIL_HOST** - SMTP server hostname
   - Example: `smtp.gmail.com` (for Gmail)
   - Example: `smtp.office365.com` (for Office 365)
   - Default: `smtp.gmail.com`

4. **EMAIL_PORT** - SMTP server port
   - Example: `587` (TLS)
   - Default: `587`

## Setup Instructions

1. Go to DigitalOcean App Platform dashboard
2. Select the `wp-request-form` app
3. Go to Settings → Environment Variables
4. Add the above variables
5. Mark EMAIL_PASSWORD as encrypted
6. Save and redeploy

## Email Behavior

- **To:** Requester's email (from form submission)
- **CC:** max@sheragency.com (automatically added to all notifications)
- **Subject:** WordPress Site Request Received - [Request ID]
- **Body:** Request details including migration sources (post types OR page templates)

## Note

If EMAIL_PASSWORD is not set, the app will still function but email notifications will be skipped. Slack notifications will still work.
