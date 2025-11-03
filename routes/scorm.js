const express = require('express');
const scormController = require('../controllers/scormController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all SCORM packages for the authenticated user
router.get('/', auth, scormController.getAllSCORMs);

// Get a specific SCORM package
router.get('/:id', auth, scormController.getSCORM);

// Create a new SCORM package
router.post('/', auth, scormController.createSCORM);

// Update a SCORM package
router.put('/:id', auth, scormController.updateSCORM);

// Delete a SCORM package
router.delete('/:id', auth, scormController.deleteSCORM);

// Publish a SCORM package
router.post('/:id/publish', auth, scormController.publishSCORM);

// Generate SCORM package with TTS audio
router.post('/:id/generate', auth, scormController.generateSCORM);

// Generate SCORM from document upload
router.post('/generate-from-doc', auth, scormController.upload.single('document'), scormController.generateSCORMFromDoc);

module.exports = router;
