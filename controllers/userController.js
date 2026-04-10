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

    const currentUserRole = req.user.role;

    //////////////////////////////////////////////////////
    // 🔒 ONLY ADMIN TYPES CAN CREATE USERS
    //////////////////////////////////////////////////////
    if (!["SUPER_ADMIN", "ADMIN"].includes(currentUserRole)) {
      return res.status(403).json({
        message: "Only admins can create users"
      });
    }

    //////////////////////////////////////////////////////
    // 🔒 ADMIN RESTRICTIONS
    //////////////////////////////////////////////////////
    if (currentUserRole === "ADMIN" && role === "ADMIN") {
      return res.status(403).json({
        message: "Admin cannot create another Admin"
      });
    }

    //////////////////////////////////////////////////////
    // ✅ ALLOWED ROLES
    //////////////////////////////////////////////////////
    const allowedRoles = [
      "SUPER_ADMIN",
      "ADMIN",
      "MANAGER",
      "ANALYST",
      "SUBUSER"
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role`
      });
    }

    //////////////////////////////////////////////////////
    // 🚨 ONLY ONE SUPER_ADMIN
    //////////////////////////////////////////////////////
    if (role === "SUPER_ADMIN") {
      const existingSuperAdmin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" }
      });

      if (existingSuperAdmin) {
        return res.status(400).json({
          message: "Super Admin already exists"
        });
      }
      if (!isValidPassword(password)) {
  return res.status(400).json({
    message:
      "Password must be 12–16 characters, start with a capital letter, include at least one number and one special character"
  });
}
    }

    //////////////////////////////////////////////////////
    // 🔍 CHECK EMAIL
    //////////////////////////////////////////////////////
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    //////////////////////////////////////////////////////
    // 🔐 HASH PASSWORD
    //////////////////////////////////////////////////////
    const hash = await bcrypt.hash(password, 10);

    //////////////////////////////////////////////////////
    // 👨‍💼 CREATE USER
    //////////////////////////////////////////////////////
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role,
        parentId:
          role === "SUPER_ADMIN"
            ? null
            : req.user.id
      }
    });

    res.json({
      message: "User created successfully",
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getUsers = async (req, res) => {
  try {
    const { status, role } = req.query;

    let where = {};

    // If not admin → only their team
   if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
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

// ❌ Cannot modify SUPER_ADMIN
if (existingUser.role === "SUPER_ADMIN") {
  return res.status(403).json({
    message: "Super Admin cannot be modified"
  });
}

// ❌ ADMIN cannot modify another ADMIN
if (req.user.role === "ADMIN" && existingUser.role === "ADMIN") {
  return res.status(403).json({
    message: "Admin cannot modify another Admin"
  });
}

    const { name, role, status } = req.body;

// ❌ Cannot modify SUPER_ADMIN
if (existingUser.role === "SUPER_ADMIN") {
  return res.status(403).json({
    message: "Super Admin cannot be modified"
  });
}

// ❌ ADMIN cannot modify another ADMIN
if (req.user.role === "ADMIN" && existingUser.role === "ADMIN") {
  return res.status(403).json({
    message: "Admin cannot modify another Admin"
  });
}

// ❌ ADMIN cannot assign ADMIN role
if (req.user.role === "ADMIN" && role === "ADMIN") {
  return res.status(403).json({
    message: "Admin cannot assign Admin role"
  });
}

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
    const userId = Number(id);

    //////////////////////////////////////////////////////
    // ✅ CHECK USER EXISTS
    //////////////////////////////////////////////////////
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

  // ❌ Block deleting SUPER_ADMIN
if (existingUser.role === "SUPER_ADMIN") {
  return res.status(403).json({
    message: "Super Admin cannot be deleted"
  });
}

// ❌ ADMIN cannot delete ADMIN
if (req.user.role === "ADMIN" && existingUser.role === "ADMIN") {
  return res.status(403).json({
    message: "Admin cannot delete another Admin"
  });
}

    //////////////////////////////////////////////////////
    // 🔥 DELETE LOGS
    //////////////////////////////////////////////////////
    await prisma.activityLog.deleteMany({
      where: { userId }
    });

    //////////////////////////////////////////////////////
    // 🔥 SOFT DELETE USER
    //////////////////////////////////////////////////////
    await prisma.user.update({
      where: { id: userId },
      data: { status: "INACTIVE" }
    });

    res.json({
      message: "User disabled and logs deleted successfully"
    });

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

    // ❌ Block SUPER_ADMIN status change
if (existingUser.role === "SUPER_ADMIN") {
  return res.status(403).json({
    message: "Super Admin status cannot be changed"
  });
}

// ❌ ADMIN cannot change ADMIN status
if (req.user.role === "ADMIN" && existingUser.role === "ADMIN") {
  return res.status(403).json({
    message: "Admin cannot change another Admin status"
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