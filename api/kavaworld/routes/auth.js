const { Router } = require('express');
const auth = require('../controllers/auth');

const router = Router();

router.post('/signup', auth.signup)
router.post('/send_verification_link', auth.sendVerificationLink)
router.post('/verify_email', auth.verifyEmail)
router.post('/login', auth.login)
router.post('/send_reset_link', auth.sendResetLink)
router.post('/reset_password', auth.resetPassword)

module.exports = router;