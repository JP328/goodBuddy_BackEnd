const router = require('express').Router()
const UserController = require('../controllers/UserControlller')

router.post('/register', UserController.register)

module.exports = router
