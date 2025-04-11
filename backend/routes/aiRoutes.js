const express = require('express');
const { processTaskInput } = require('../controllers/aiController');
const router = express.Router();

router.post('/process-task', processTaskInput);

module.exports = router;
