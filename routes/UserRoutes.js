const router = require('express').Router()
const UserController = require('../controllers/UserControlller')

router.post('/register', UserController.register)
router.post('/login', UserController.login)
router.post('/check-user', UserController.checkUser)

module.exports = router
