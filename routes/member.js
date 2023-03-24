const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const Community = require('../models/community');
const Member = require('../models/member');
const Role = require('../models/role');

// Add a member to a community
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const communityId = req.body.communityId;

    // Check if the current user is a community admin
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }
    const isAdmin = community.owner.equals(req.userId);
    if (!isAdmin) {
      return res.status(401).json({ message: "You are not authorized to add members to this community" });
    }

    // Find the role to assign to the member
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Add the new member to the community
    const newMember = new Member({
      user: userId,
      community: communityId,
      role: roleId
    });
    const savedMember = await newMember.save();

    res.status(201).json(savedMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Remove a member from the community
router.delete("/member/:id", verifyToken, async (req, res) => {
  try {
    // Get the member id from the request parameters
    const memberId = req.params.id;

    // Find the member object in the database
    const member = await Member.findById(memberId);

    // Throw an error if the member is not found
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Find the community object in the database
    const community = await Community.findById(member.community);

    // Throw an error if the community is not found
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Get the role of the current user in the community
    const userRole = await Member.findOne({
      user: req.userId,
      community: community.id,
    }).populate("role");

    // Throw an error if the current user is not a community admin or moderator
    if (
      userRole.role.name !== "Community Admin" &&
      userRole.role.name !== "Community Moderator"
    ) {
      return res.status(403).json({ message: "Not allowed access" });
    }

    // Remove the member object from the database
    await member.remove();

    res.status(200).json({ message: "Member removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
