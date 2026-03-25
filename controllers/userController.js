const prisma = require('../prisma/prismaClient');
const bcrypt = require('bcrypt');
//////////////////////////////////////////////////////
// ✅ VALIDATION FUNCTIONS
//////////////////////////////////////////////////////

const isValidCompanyEmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@dhatvibs\.com$/.test(email);
};

const isValidPassword = (password) => {
  return /^[A-Z][A-Za-z\d@$!%*?&]{7,}$/.test(password);
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ✅ EMAIL VALIDATION
    if (!isValidCompanyEmail(email)) {
      return res.status(400).json({
        message: "Only @dhatvibs.com emails are allowed"
      });
    }

    // ✅ PASSWORD VALIDATION
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must start with a capital letter and be at least 8 characters long"
      });
    }

    if (role === "ADMIN") {
      return res.status(403).json({
        message: "Admin cannot be created via API"
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const parentId =
      req.user.role === "ADMIN" ? null : req.user.id;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role,
        parentId
      }
    });

    res.json({ message: "User created", user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getUsers = async (req, res) => {
  try {
    const { status, role } = req.query;

    let where = {};

    // If not admin → only their team
    if (req.user.role !== "ADMIN") {
      where.parentId = req.user.id;
    }

    if (status) where.status = status;
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    res.json(users);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    // 🔥 BLOCK ADMIN EDIT
    if (existingUser.role === "ADMIN") {
      return res.status(403).json({
        message: "Admin details cannot be modified"
      });
    }

    const { name, role, status } = req.body;

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { name, role, status }
    });

    res.json({ message: "User updated", user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    // 🔥 BLOCK ADMIN DELETE
    if (existingUser.role === "ADMIN") {
      return res.status(403).json({
        message: "Admin cannot be deleted"
      });
    }

    await prisma.user.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "User deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    // 🔥 BLOCK ADMIN STATUS CHANGE
    if (existingUser.role === "ADMIN") {
      return res.status(403).json({
        message: "Admin status cannot be changed"
      });
    }

    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status }
    });

    res.json({ message: "Status updated", user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    res.json(user);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name }
    });

    res.json({
      message: "Profile updated successfully",
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};