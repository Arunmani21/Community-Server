const express = require("express");
const router = express.Router();
const Role = require('../models/role');

const app = express();
app.use(express.json());

// Create a new role with the given name
router.post('/c', async (req, res) => {
  const { name } = req.body;
  
  // Check if the role already exists
  const existingRole = await Role.findOne({ name });
  if (existingRole) {
    return res.status(400).json({ message: 'Role already exists' });
  }

  // Set the scopes for the new role based on the role name
  let scopes = [];
  switch (name) {
    case 'Community Admin':
      scopes = ['add_member', 'remove_member', 'promote_member'];
      break;
    case 'Community Moderator':
      scopes = ['remove_member'];
      break;
    case 'Community Member':
      scopes = ['view_members'];
      break;
    default:
      return res.status(400).json({ message: 'Invalid role name' });
  }

  const newRole = new Role({
    name,
    scopes,
  });

  try {
    await newRole.save();
    res.status(201).json({ message: 'Role created successfully', role: newRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating role' });
  }
});

// Get all roles
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json({ roles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error getting roles' });
  }
});

module.exports = router;

