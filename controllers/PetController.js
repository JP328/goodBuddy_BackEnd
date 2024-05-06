const Pet = require('../models/Pet')

//helpers
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')
const ObjectId = require('mongoose').Types.ObjectId

module.exports = class PetController {
  static async create(req, res) {
    const { name, age, weight, color, breed } = req.body

    const images = req.files
    const available = true

    //images upload

    //validation
    if (!name) {
      res.status(422).json({ message: 'Nome é um campo obrigatório!' })
      return
    }

    if (!age) {
      res.status(422).json({ message: 'Idade é um campo obrigatório!' })
      return
    }

    if (!weight) {
      res.status(422).json({ message: 'Peso é um campo obrigatório!' })
      return
    }

    if (!color) {
      res.status(422).json({ message: 'Cor é um campo obrigatório!' })
      return
    }

    if (!breed) {
      res.status(422).json({ message: 'A Raça é um campo obrigatório!' })
      return
    }

    if (images.length === 0) {
      res
        .status(422)
        .json({ message: 'É necessário colocar ao menos uma imagem do pet!' })
      return
    }

    //get pet owner
    const token = getToken(req)
    const petOwner = await getUserByToken(token)

    //create a pet
    const pet = new Pet({
      name,
      age,
      weight,
      color,
      breed,
      available,
      images: [],
      user: {
        _id: petOwner._id,
        name: petOwner.name,
        phone: petOwner.phone,
        image: petOwner.image
      }
    })

    images.map(image => pet.images.push(image.filename))

    try {
      const newPet = await pet.save()

      res.status(201).json({
        message: 'Pet cadastrado com sucesso!',
        newPet
      })
    } catch (err) {
      res.status(500).json({ message: err })
    }
  }

  static async getAll(req, res) {
    const pets = await Pet.find().sort('-createdAt')

    res.status(200).json({ pets })
  }

  static async getAllUserPets(req, res) {
    const token = getToken(req)
    const user = await getUserByToken(token)

    const pets = await Pet.find({ 'user._id': user._id }).sort('-createdAt')

    res.status(200).json({ pets })
  }

  static async getAllUserAdoptions(req, res) {
    const token = getToken(req)
    const user = await getUserByToken(token)

    const pets = await Pet.find({ 'adopter._id': user._id }).sort('-createdAt')

    res.status(200).json({ pets })
  }

  static async getPetById(req, res) {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: 'ID Inválido!' })
      return
    }

    const pet = await Pet.findOne({ _id: id })

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' })
      return
    }

    res.status(200).json({ pet: pet })
  }

  static async removePetById(req, res) {
    const id = req.params.id

    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: 'ID Inválido!' })
      return
    }

    const pet = await Pet.findOne({ _id: id })

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' })
      return
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.toString() !== user._id.toString()) {
      res
        .status(422)
        .json({ message: 'Você não tem permissão para executar essa ação!' })
      return
    }

    await Pet.findByIdAndDelete(id)

    res.status(200).json({ message: 'Pet removido com sucesso!' })
  }

  static async updatePet(req, res) {
    const id = req.params.id

    const { name, age, weight, color, breed, available } = req.body

    const images = req.files

    const updatedData = {}

    const pet = await Pet.findOne({ _id: id })

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' })
      return
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    if (pet.user._id.toString() !== user._id.toString()) {
      res
        .status(422)
        .json({ message: 'Você não tem permissão para executar essa ação!' })
      return
    }

    //validation
    if (!name) {
      res.status(422).json({ message: 'Nome é um campo obrigatório!' })
      return
    } else {
      updatedData.name = name
    }

    if (!age) {
      res.status(422).json({ message: 'Idade é um campo obrigatório!' })
      return
    } else {
      updatedData.age = age
    }

    if (!weight) {
      res.status(422).json({ message: 'Peso é um campo obrigatório!' })
      return
    } else {
      updatedData.weight = weight
    }

    if (!color) {
      res.status(422).json({ message: 'Cor é um campo obrigatório!' })
      return
    } else {
      updatedData.color = color
    }

    if (!breed) {
      res.status(422).json({ message: 'A Raça é um campo obrigatório!' })
      return
    } else {
      updatedData.breed = breed
    }

    if (images.length === 0) {
      res
        .status(422)
        .json({ message: 'É necessário colocar ao menos uma imagem do pet!' })
      return
    } else {
      updatedData.images = []
      images.map(image => {
        updatedData.images.push(image.filename)
      })
    }

    await Pet.findByIdAndUpdate(id, updatedData)

    res.status(200).json({ message: 'Informações atualizadas com sucesso!' })
  }

  static async schedule(req, res) {
    const id = req.params.id

    const pet = await Pet.findOne({ _id: id })

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' })
      return
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    //check if pet is available
    if (!pet.available) {
      res.status(422).json({
        message: 'Esse pet já foi adotado! Não está mais disponível.'
      })
      return
    }
    
    //check if user is the owner of the pet
    if (pet.user._id.equals(user._id)) {
      res.status(422).json({
        message: 'Você não pode agendar uma visita com o seu proprio Pet!'
      })
      return
    }
    
    
    //check if user has already scheduled a visit
    if (pet.adopter) {
      if (pet.adopter._id.equals(user._id)) {
        res.status(422).json({
          message: 'Você já possue uma visita agendada para este Pet!'
        })
        return
      }
    }


    // Add user as an Adopter
    pet.adopter = {
      _id: user._id,
      name: user.name,
      image: user.image
    }

    await Pet.findByIdAndUpdate(id, pet)

    res.status(200).json({
      message: `A visita foi agendada com sucesso, entre em contato com ${pet.user.name} pelo telefone ${pet.user.phone}`
    })
  }

  static async concludeAdoption(req, res) {
    const id = req.params.id

    const pet = await Pet.findOne({ _id: id })

    if (!pet) {
      res.status(404).json({ message: 'Pet não encontrado!' })
      return
    }

    const token = getToken(req)
    const user = await getUserByToken(token)

    if (!pet.user._id.equals(user._id)) {
      res
        .status(422)
        .json({ message: 'Você não possue permissão para executar essa ação!' })
      return
    }

    pet.available = false

    await Pet.findByIdAndUpdate(id, pet)

    res
      .status(200)
      .json({ message: 'Ciclo de adoção finalizado com sucesso, parabéns!' })
  }
}
