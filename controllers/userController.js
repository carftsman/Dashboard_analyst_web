const prisma = require('../prisma/prismaClient');
const bcrypt = require('bcrypt');

exports.createUser = async (req, res) => {
  try {
    const { fullName, email, password, role, status, createdById } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
        status: status || 'ACTIVE',
        createdById: createdById || null
      }
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        createdById: user.createdById
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Create user failed',
      error: error.message
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdById: true,
        createdAt: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch users failed',
      error: error.message
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdById: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch user failed',
      error: error.message
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { fullName, email, role, status } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName,
        email,
        role,
        status
      }
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Update user failed',
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        status: 'INACTIVE'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Delete user failed',
      error: error.message
    });
  }
};