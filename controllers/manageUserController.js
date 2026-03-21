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