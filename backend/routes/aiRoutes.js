const express = require('express');
const { processTaskInput, sendAiFeatureEmail } = require('../controllers/aiController');
const router = express.Router();

router.post('/process-task', processTaskInput);

// Route to send AI feature announcement email
router.post('/send-ai-feature-email', sendAiFeatureEmail);

module.exports = router;
