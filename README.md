# WordPress Site Request Form

A web application for team members to request WordPress site deployments from a base template snapshot with automated backend processing.

## 🚀 Live Deployment

**URL:** TBD (will be deployed to DigitalOcean App Platform)

## 📋 Overview

This form allows team members to request new WordPress site setups without manual intervention. The system collects all necessary configuration details, notifies Kit, and provides a structured workflow for automation.

## 🔧 Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js + Express
- **Storage:** JSON file-based persistence
- **Notifications:** Slack integration via OpenClaw
- **Hosting:** DigitalOcean App Platform

## 📝 Form Fields

### Required Fields
1. **Requester Name** - Person requesting the site
2. **Requester Email** - Contact email for updates
3. **Replit Front-end URL** - Front-end application URL to configure in WordPress plugin
4. **Post Types to Migrate** - One or more post types with source URLs
   - Post Type Name (e.g., "Blogs", "News")
   - Source URL (e.g., "https://example.com/blog/")

### Optional Fields
1. **Project Name** - Descriptive name for the project
2. **Project Description** - Additional context

## 🔄 Automation Workflow

### Phase 1: Request Submission (Automated)
1. User fills out form with all required information
2. Frontend validates input (required fields, URL formats)
3. Form submits data to `/api/submit` endpoint
4. Backend:
   - Generates unique request ID (`wp-req-{timestamp}`)
   - Saves request to JSON file in `data/` directory
   - Creates notification file for Kit
   - Returns success confirmation to user

### Phase 2: Kit Notification (Automated)
1. Backend creates notification file: `data/notification_{requestId}.json`
2. Contains:
   ```json
   {
     "channel": "D0ADEL2FRCM",
     "requestData": {
       "id": "wp-req-1234567890",
       "timestamp": "2026-02-11T20:20:00.000Z",
       "requesterName": "John Doe",
       "requesterEmail": "john@example.com",
       "replitUrl": "https://project.repl.co",
       "postTypes": [
         {
           "name": "Blogs",
           "sourceUrl": "https://example.com/blog/"
         }
       ],
       "projectName": "Client Project",
       "projectDescription": "Migration project",
       "status": "pending"
     }
   }
   ```
3. Kit's monitoring system polls `/api/notifications` endpoint
4. When notification is detected, Kit processes it and sends Slack message
5. Notification file is deleted after successful processing

### Phase 3: Droplet Provisioning (Kit → Forge)
**Trigger:** Kit receives notification

**Kit's Actions:**
1. Reads request details from notification
2. Spawns Forge agent with provisioning task
3. Provides Forge with:
   - Request ID
   - Replit front-end URL
   - Post types to migrate
   - Requester contact info

**Forge's Automation Tasks:**
1. **Create DigitalOcean Droplet from Snapshot**
   - Use base WordPress template snapshot
   - Configure droplet with appropriate resources
   - Assign public IP address
   - Set up DNS (if applicable)

2. **Configure Custom Plugin**
   - SSH into new droplet
   - Navigate to WordPress plugin directory
   - Update plugin settings with Replit URL
   - Example: `wp option update custom_plugin_frontend_url '{replitUrl}'`

3. **Run Content Migration**
   - For each post type specified:
     ```bash
     wp import-posts \
       --type="{postTypeName}" \
       --source="{sourceUrl}" \
       --force-update
     ```
   - Validate migration success
   - Log any errors or warnings

4. **Create Admin Credentials**
   - Generate secure admin credentials:
     ```bash
     wp user create admin{random} admin@project.com \
       --role=administrator \
       --user_pass={secure_password}
     ```
   - Store credentials securely

5. **Final Configuration**
   - Update site URL settings
   - Clear WordPress cache
   - Test site accessibility
   - Verify plugin configuration

6. **Return Results to Max**
   - Droplet IP address
   - WordPress admin URL
   - Admin username & password
   - Migration summary (posts migrated per type)
   - Any warnings or notes

### Phase 4: Delivery (Forge → Max)
**Format:** Slack message to Max with:
```
✅ WordPress Site Ready

Request ID: wp-req-1234567890
Project: Client Project
Requester: John Doe (john@example.com)

🌐 Site Access
URL: http://123.456.789.0
Admin: http://123.456.789.0/wp-admin

🔐 Credentials
Username: admin_xyz123
Password: [secure_password]

📦 Migration Summary
- Blogs: 45 posts migrated from https://example.com/blog/
- News: 23 posts migrated from https://example.com/news/

⚙️ Configuration
- Replit Frontend: https://project.repl.co
- Plugin Status: Active & Configured

Notes: All systems operational
```

## 🔌 API Endpoints

### POST `/api/submit`
Submit a new WordPress site request.

**Request Body:**
```json
{
  "requesterName": "John Doe",
  "requesterEmail": "john@example.com",
  "replitUrl": "https://project.repl.co",
  "postTypes": [
    {
      "name": "Blogs",
      "sourceUrl": "https://example.com/blog/"
    }
  ],
  "projectName": "Optional Project Name",
  "projectDescription": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "wp-req-1234567890",
  "message": "Request submitted successfully. Kit has been notified."
}
```

### GET `/api/requests`
List all submitted requests (for Kit's reference).

**Response:**
```json
{
  "success": true,
  "requests": [...]
}
```

### GET `/api/notifications`
List pending notifications for Kit to process.

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "file": "notification_wp-req-1234567890.json",
      "data": {...}
    }
  ]
}
```

### DELETE `/api/notifications/:file`
Clear a notification after processing.

**Response:**
```json
{
  "success": true,
  "message": "Notification cleared"
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-11T20:20:00.000Z"
}
```

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Server runs on http://localhost:8080
```

## 📦 Deployment to DigitalOcean App Platform

### Prerequisites
- DigitalOcean account
- GitHub repository
- DigitalOcean API token

### Deployment Steps

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: WordPress request form"
   git remote add origin https://github.com/maxdevs97/wp-request-form.git
   git push -u origin main
   ```

2. **Create App on DigitalOcean:**
   - Connect GitHub repository
   - Set build command: `npm install`
   - Set run command: `npm start`
   - Configure environment variables (if needed)
   - Set HTTP port: 8080

3. **Deploy:**
   - DigitalOcean will auto-deploy on push to main branch
   - Live URL will be provided

### Environment Variables
None required for basic operation. All data stored in local `data/` directory.

## 🔐 Security Considerations

1. **Input Validation:** All form inputs validated on frontend and backend
2. **Email Validation:** Ensures valid email format
3. **URL Validation:** Validates URL formats for Replit and source URLs
4. **Rate Limiting:** Consider adding rate limiting for production
5. **Authentication:** Consider adding basic auth for `/api/requests` endpoint

## 📊 Monitoring

- Check `/health` endpoint for system status
- Monitor `data/` directory for pending requests
- Review notification files for processing status

## 🛠️ Future Enhancements

1. **Database Integration:** Replace JSON files with MongoDB or PostgreSQL
2. **Real-time Slack Integration:** Direct Slack API integration
3. **Status Dashboard:** Web UI for Kit to view and manage requests
4. **Email Notifications:** Send confirmation emails to requesters
5. **Webhook Integration:** Forge reports back to form when complete
6. **Request Status Tracking:** Allow users to check request status
7. **Request History:** View past requests and their outcomes

## 📞 Support

For issues or questions, contact:
- **Kit** (agent:kit:main) - Backend automation
- **Max** (max@sheragency.com) - System oversight

---

**Version:** 1.0.0  
**Last Updated:** February 11, 2026  
**Built by:** Forge (agent:forge)
