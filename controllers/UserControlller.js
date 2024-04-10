const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// helpers
const createUserToken = require('../helpers/create-user-token')
const getToken = require('../helpers/get-token')

module.exports = class UserController {
  static async register(req, res) {
    const { name, email, phone, password, confirmPassword } = req.body

    //validations
    if (!name) {
      res.status(422).json({ message: 'O nome é obrigatório' })
      return
    }

    if (!email) {
      res.status(422).json({ message: 'O e-mail é obrigatório' })
      return
    }

    if (!phone) {
      res.status(422).json({ message: 'O telefone é obrigatório' })
      return
    }

    if (!password) {
      res.status(422).json({ message: 'A senha é obrigatória' })
      return
    }

    if (!confirmPassword) {
      res.status(422).json({ message: 'A confirmação da senha é obrigatória!' })
      return
    }

    if (confirmPassword !== password) {
      res.status(422).json({
        message: 'A confirmação da senha precisa ser identica a senha!'
      })
      return
    }

    //check if user exists
    const userExists = await User.findOne({ email: email })

    if (userExists) {
      res.status(422).json({
        message:
          'Usuário já possui cadastro no sistema. Por favor, utilize outro e-mail!'
      })
      return
    }

    //create a password
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    //create user
    const user = new User({
      name,
      email,
      phone,
      password: passwordHash
    })

    try {
      const newUser = await user.save()

      await createUserToken(newUser, req, res)
    } catch (err) {
      res.status(500).json({ message: err })
    }
  }

  static async login(req, res) {
    const { email, password } = req.body

    if (!email) {
      res.status(422).json({ message: 'O Email é obrigatório!' })
      return
    }

    if (!password) {
      res.status(422).json({ message: 'A senha é obrigatória!' })
      return
    }

    //check if user exists
    const user = await User.findOne({ email: email })

    if (!user) {
      res.status(422).json({
        message:
          'Usuário não possui cadastro no sistema. Por favor, utilize um usuário válido!'
      })
      return
    }

    //check if user's password match with db password
    const checkPassword = await bcrypt.compare(password, user.password)

    if (!checkPassword) {
      res.status(422).json({ message: 'Senha inválida!' })
      return
    }

    await createUserToken(user, req, res)
  }

  static async checkUser(req, res) {
    let currentUser

    if (req.headers.authorization) {
      const token = getToken(req)
      const decoded = jwt.verify(token, 'nossosecret')

      currentUser = await User.findById(decoded.id)
      currentUser.password = undefined
    } else {
      currentUser = null
    }

    res.status(200).send(currentUser)
  }
}
