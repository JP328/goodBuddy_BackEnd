const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// helpers
const createUserToken = require('../helpers/create-user-token')
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')
const ObjectId = require('mongoose').Types.ObjectId

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
      const decoded = jwt.verify(token, process.env.Secret)

      currentUser = await User.findById(decoded.id)
      currentUser.password = undefined
    } else {
      currentUser = null
    }

    res.status(200).send(currentUser)
  }

  static async getUserById(req, res) {
    const id = req.params.id

    try {
      const user = await User.findById(id).select("-password")
      if(!user) {
        res.status(422).json({message: "Usuário não encontrado!"})
        return
      }

      res.status(200).json({ user })
    } catch (err) {
      res.status(422).json({message: "Usuário não encontrado!"})
    }

  }

  static async editUser(req, res) {
    const id = req.params.id

    //check if user exist
    const token = getToken(req)
    const user = await getUserByToken(token)
    
    const { name, email, phone, password, confirmPassword} = req.body
    
    if(req.file) {
      user.image = req.file.filename
    }

    //validations
    if (!name) {
      res.status(422).json({ message: 'O nome é obrigatório' })
      return
    }

    if (!email) {
      res.status(422).json({ message: 'O e-mail é obrigatório' })
      return
    }

    //check if email has already taken
    const userExists = await User.findOne({email: email})

    if(user.email !== email && userExists) {
      res.status(422).json({message: "Por favor, utilize outro e-mail!"})
      return
    }

    user.email = email

    if (!phone) {
      res.status(422).json({ message: 'O telefone é obrigatório' })
      return
    }

    user.phone = phone

    if (confirmPassword != password) {
      res.status(422).json({
        message: 'As senhas não conferem!'
      })
      return
    } else if(password === confirmPassword && password != null) {

      const salt = await bcrypt.genSalt(12)
      const passwordHash = await bcrypt.hash(password, salt) 

      user.password = passwordHash
    }

    try {
      const updateUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $set: user },
        { new: true },
      )

      res.status(200).json({message: "Usuário atualizado com sucesso!"})
    } catch (err) {
      res.status(500).json({message: err})
      return
    }

  }

  static async removeUserById(req, res) {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: 'ID Inválido!' })
      return
    }

    const user = await User.findOne({ _id: id})

    if(!user) {
      res.status(404).json({ message: 'Usuário não encontrado!' })
      return
    }

    const token = getToken(req)
    const currentUser = await getUserByToken(token)

    if (!user._id.equals(currentUser._id)) {
      res
        .status(422)
        .json({ message: 'Você não tem permissão para executar essa ação!' })
      return
    }
    
    await User.findByIdAndDelete(id)

    res.status(200).json({message: 'Usuário removido com sucesso!'})
  }
}