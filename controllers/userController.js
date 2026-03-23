const bcrypt = require('bcrypt');
const prisma = require('../prisma/prismaClient');
const {generatePassword}= require('../utils/passwordGenarator');

// const generatePassword = (fullName, email) => {
//   const namePart = fullName.replace(/\s+/g, '').substring(0, 3);
//   const emailPart = email.split('@')[0].substring(0, 3);
//   const randomPart = Math.floor(10 + Math.random() * 90);

//   return (namePart + emailPart + randomPart).substring(0, 8);
// };

exports.createUser = async (req, res) => {
  try {
    const { fullName, email, role } = req.body;

    if (!fullName || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and role are required'
      });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        isDeleted: false
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const generatedPassword = generatePassword(fullName, email);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        role,
        password: hashedPassword,
        createdById: req.user.id,
        status: 'ACTIVE'
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
        generatedPassword
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