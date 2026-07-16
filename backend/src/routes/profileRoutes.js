//backend/src/routes/profileRoutes.js

const express = require('express');
const router = express.Router();
const {
  createOrUpdateProfile,
  getMyProfile
} = require('../controllers/profileController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/profile', createOrUpdateProfile);
router.put('/profile', createOrUpdateProfile);

router.get('/profile', getMyProfile);
router.get('/me', getMyProfile);

module.exports = router;