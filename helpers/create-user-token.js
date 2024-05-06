const jwt = require('jsonwebtoken')

const createUserToken = async (user, req, res) => {
  //create a token
  const token = jwt.sign(
    {
      name: user.name,
      id: user._id
    },
    process.env.SECRET
  )

  //return token
  res.status(200).json({
    message: 'Usuário autenticado com sucesso!',
    token: token,
    userId: user._id
  })
}

module.exports = createUserToken
