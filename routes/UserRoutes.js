const router = require('express').Router()
const UserController = require('../controllers/UserControlller')

//middleware
const verifyToken = require("../helpers/verify-token")
const { uploadImage } = require("../helpers/image-upload")

router.post('/register', UserController.register)
router.post('/login', UserController.login)
router.get('/check-user', UserController.checkUser)
router.get('/:id', UserController.getUserById)
router.patch('/edit/:id', verifyToken, uploadImage.single("image"), UserController.editUser)
router.delete('/:id', verifyToken, UserController.removeUserById)

module.exports = router
