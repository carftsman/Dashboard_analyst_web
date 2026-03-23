const prisma = require('../prisma/prismaClient');

exports.getLoggedInUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        status: true,
        email:true,
        isLoggedIn: true,
        lastLoginAt: true
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    const formattedUsers = users.map((user, index) => ({
      sNo: index + 1,
      id: user.id,
      name: user.fullName,
      role: user.role,
      email:user.email,
      status: user.status,
      isLoggedIn: user.isLoggedIn,
      lastLoginAt: user.lastLoginAt
    }));

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: formattedUsers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch users failed',
      error: error.message
    });
  }
};
exports.updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { fullName, role, status } = req.body;

    if (Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        isDeleted: false
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName || existingUser.fullName,
        role: role || existingUser.role,
        status: status || existingUser.status
      }
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
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
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        isDeleted: false
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
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