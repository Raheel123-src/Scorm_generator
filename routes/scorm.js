const express = require('express');
const scormController = require('../controllers/scormController');

const router = express.Router();

// Get all SCORM packages for the authenticated user
router.get('/', scormController.getAllSCORMs);

// Get a specific SCORM package
router.get('/:id', scormController.getSCORM);

// Create a new SCORM package
router.post('/', scormController.createSCORM);

// Update a SCORM package
router.put('/:id', scormController.updateSCORM);

// Delete a SCORM package
router.delete('/:id', scormController.deleteSCORM);

// Publish a SCORM package
router.post('/:id/publish', scormController.publishSCORM);

// Generate SCORM package with TTS audio
router.post('/:id/generate', scormController.generateSCORM);

module.exports = router;
