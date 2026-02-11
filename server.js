const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Data directory for storing requests
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

// Send Slack notification to Kit
async function sendSlackNotification(requestData) {
  // This will be called via OpenClaw message tool
  // For now, log the notification
  console.log('Slack notification would be sent to Kit (D0ADEL2FRCM):', requestData);
  
  // The actual Slack integration will be handled by OpenClaw runtime
  // Store this as a pending notification
  const notificationFile = path.join(DATA_DIR, `notification_${requestData.id}.json`);
  await fs.writeFile(notificationFile, JSON.stringify({
    channel: 'D0ADEL2FRCM',
    requestData: requestData
  }, null, 2));
  
  return { success: true };
}

// POST /api/submit - Handle form submission
app.post('/api/submit', async (req, res) => {
  try {
    const {
      requesterName,
      requesterEmail,
      replitUrl,
      postTypes,
      projectName,
      projectDescription
    } = req.body;

    // Validation
    if (!requesterName || !requesterEmail || !replitUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: requesterName, requesterEmail, or replitUrl'
      });
    }

    if (!postTypes || postTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one post type must be specified'
      });
    }

    // Generate unique ID
    const timestamp = new Date().toISOString();
    const id = `wp-req-${Date.now()}`;

    const requestData = {
      id,
      timestamp,
      requesterName,
      requesterEmail,
      replitUrl,
      postTypes,
      projectName: projectName || 'Unnamed Project',
      projectDescription: projectDescription || '',
      status: 'pending'
    };

    // Save request to JSON file
    const requestFile = path.join(DATA_DIR, `${id}.json`);
    await fs.writeFile(requestFile, JSON.stringify(requestData, null, 2));

    // Send Slack notification
    await sendSlackNotification(requestData);

    res.json({
      success: true,
      requestId: id,
      message: 'Request submitted successfully. Kit has been notified.'
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/requests - List all requests (for Kit's reference)
app.get('/api/requests', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const requestFiles = files.filter(f => f.startsWith('wp-req-') && f.endsWith('.json'));
    
    const requests = await Promise.all(
      requestFiles.map(async (file) => {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
        return JSON.parse(content);
      })
    );

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.json({ success: true, requests: [] });
  }
});

// GET /api/notifications - List pending notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const notificationFiles = files.filter(f => f.startsWith('notification_') && f.endsWith('.json'));
    
    const notifications = await Promise.all(
      notificationFiles.map(async (file) => {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
        return { file, data: JSON.parse(content) };
      })
    );

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.json({ success: true, notifications: [] });
  }
});

// DELETE /api/notifications/:file - Clear notification after processing
app.delete('/api/notifications/:file', async (req, res) => {
  try {
    const file = req.params.file;
    await fs.unlink(path.join(DATA_DIR, file));
    res.json({ success: true, message: 'Notification cleared' });
  } catch (error) {
    console.error('Error clearing notification:', error);
    res.status(500).json({ success: false, error: 'Failed to clear notification' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
ensureDataDir().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WordPress request form server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
