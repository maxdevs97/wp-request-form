#!/usr/bin/env node

/**
 * Slack Notification Handler for WordPress Request Form
 * 
 * This script polls the WordPress request form API for pending notifications
 * and sends them to Kit via Slack (channel D0ADEL2FRCM).
 * 
 * Usage: 
 *   Run manually: node slack-notifier.js
 *   Run as cron job: */5 * * * * /path/to/slack-notifier.js
 * 
 * This would be integrated into Kit's automation system.
 */

const https = require('https');
const http = require('http');

const API_BASE = process.env.WP_REQUEST_FORM_API || 'https://wp-request-form-kbpck.ondigitalocean.app';
const KIT_CHANNEL_ID = 'D0ADEL2FRCM';

// Fetch pending notifications from the API
async function fetchNotifications() {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/api/notifications`;
    const lib = url.startsWith('https') ? https : http;
    
    lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Clear processed notification
async function clearNotification(filename) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/api/notifications/${filename}`;
    const lib = url.startsWith('https') ? https : http;
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'DELETE'
    };
    
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Format request data for Slack message
function formatSlackMessage(requestData) {
  const postTypesFormatted = requestData.postTypes
    .map(pt => {
      const typeLabel = pt.migrationType === 'pageTemplate' ? 'Page Template' : 'Post Type';
      return `  • ${typeLabel}: ${pt.name} from ${pt.sourceUrl}`;
    })
    .join('\n');
  
  return `
🚀 *New WordPress Site Request* (Auto-Processing)

*Request ID:* \`${requestData.id}\`
*Requester:* ${requestData.requesterName} (${requestData.requesterEmail})
*Project:* ${requestData.projectName}
${requestData.projectDescription ? `*Description:* ${requestData.projectDescription}` : ''}

*Replit Frontend URL:* ${requestData.replitUrl}

*Migration Sources:*
${postTypesFormatted}

*Submitted:* ${new Date(requestData.timestamp).toLocaleString()}
*Status:* Processing automatically (no approval required)

---
_Automated workflow initiated. Forge should:_
1. Create droplet from snapshot
2. Configure plugin with Replit URL
3. Migrate specified post types/templates
4. Generate admin credentials
5. Report results to Max and requester
`.trim();
}

// Main execution
async function main() {
  try {
    console.log('Checking for pending WordPress site requests...');
    
    const result = await fetchNotifications();
    
    if (!result.success) {
      console.error('Failed to fetch notifications:', result);
      return;
    }
    
    const notifications = result.notifications || [];
    console.log(`Found ${notifications.length} pending notification(s)`);
    
    for (const notification of notifications) {
      const { file, data } = notification;
      const { requestData } = data;
      
      console.log(`\nProcessing request: ${requestData.id}`);
      
      // Format message
      const message = formatSlackMessage(requestData);
      
      // In a real implementation, this would use the OpenClaw message tool
      // or Slack API directly. For now, we log the message.
      console.log('\n--- SLACK MESSAGE TO KIT ---');
      console.log(`Channel: ${KIT_CHANNEL_ID}`);
      console.log('Message:');
      console.log(message);
      console.log('--- END MESSAGE ---\n');
      
      // In production, you would call:
      // await sendSlackMessage(KIT_CHANNEL_ID, message);
      
      // Clear the notification
      const clearResult = await clearNotification(file);
      console.log(`Notification cleared: ${clearResult.success ? 'SUCCESS' : 'FAILED'}`);
    }
    
    console.log('\nNotification processing complete.');
    
  } catch (error) {
    console.error('Error processing notifications:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { fetchNotifications, formatSlackMessage, clearNotification };
