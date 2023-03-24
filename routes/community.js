const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const Community = require('../models/community');
const Role = require('../models/role');
const Member = require('../models/member');
const User = require("../models/user");

function paginate(model, query, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const countPromise = model.countDocuments(query);
  const docsPromise = model.find(query).skip(skip).limit(limit);

  return Promise.all([countPromise, docsPromise]).then(([count, docs]) => {
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      docs,
      totalDocs: count,
      totalPages,
      page,
      limit,
      hasNextPage,
      hasPrevPage,
    };
  });
}

// Create a new community
const createCommunity = async (name, ownerId, adminRoleId) => {
  // Generate the slug from the community name
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  // Create the initial member object for the community admin
  const member = new Member({
    user: ownerId,
    community: undefined, // This will be filled in once the community is created
    role: adminRoleId
  });

  // Create the new community object
  const newCommunity = new Community({
    name,
    slug,
    owner: ownerId,
    members: [member]
  });

  // Save the new community to the database
  const savedCommunity = await newCommunity.save();

  // Update the member object with the community ID
  member.community = savedCommunity._id;
  await member.save();

  // Return the saved community object
  return savedCommunity;
};

router.post('/create', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    const adminRole = await Role.findOne({ name: 'Community Admin' });
    const ownerId = req.userId;

    // Create the new community and get the saved community object
    const savedCommunity = await createCommunity(name, ownerId, adminRole._id);

    res.status(201).json(savedCommunity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all communities API with pagination
router.get('/communities', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const communities = await paginate(Community, {}, page, limit);
    res.status(200).json(communities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get owned communities API with pagination
router.get('/communities/owned', verifyToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const ownerId = req.userId;
    const communities = await paginate(
      Community,
      { owner: ownerId },
      page,
      limit
    );
    res.status(200).json(communities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get joined communities API with pagination
router.get('/communities/joined', verifyToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const userId = req.userId;
    console.log('userId:', userId);

    const communities = await paginate(
      Community,
      { 'members.user': userId },
      page,
      limit,
      {},
      [
        { model: Member, select: '-_id user role' }
      ]
    );
    console.log('communities:', communities);

    res.status(200).json(communities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// Get community members API with pagination
router.get('/communities/:id/members', verifyToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const communityId = req.params.id;

  try {
    const members = await paginate(
      Member,
      { community: communityId },
      page,
      limit
    );

    // Populate user and community fields
    const populatedMembers = await Member.populate(members.docs, [
      { path: 'user', select: 'name' },
      { path: 'community', select: 'name slug' },
      { path: 'role', select: 'name' },
    ]);

    res.status(200).json({
      docs: populatedMembers,
      totalDocs: members.totalDocs,
      totalPages: members.totalPages,
      page: members.page,
      limit: members.limit,
      hasNextPage: members.hasNextPage,
      hasPrevPage: members.hasPrevPage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
