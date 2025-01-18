const express = require('express');
const { getTasks, addTask, deleteTask, updateTask } = require('../controllers/taskController');
const router = express.Router();

router.get('/:userId', getTasks);
router.post('/', addTask);
router.delete('/:id', deleteTask);
router.put('/:id', updateTask);

module.exports = router;