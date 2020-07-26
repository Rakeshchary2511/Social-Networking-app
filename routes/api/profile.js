const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const { check, validationResult } = require("express-validator");

//@route GET api/profile/me
//@desc Get user profile
//@access private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: "There is no profile for this user " });
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error!!");
  }
});

//@route GET api/profile
//@desc Create or Update user profile
//@access private
router.post("/", [
  auth,
  [
    check("status", "Status is required!").not().isEmpty(),
    check("skills", "Skills are required!").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const {
      website,
      bio,
      company,
      location,
      status,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedIn,
    } = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    //Build social object
    profileFields.social = {};
    if (facebook) profileFields.social.facebok = facebook;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedIn) profileFields.social.linkedIn = linkedIn;
    if (twitter) profileFields.social.twitter = twitter;
    if (youtube) profileFields.social.youtube = youtube;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          {
            new: true,
          }
        );
        console.log("Profile Updated !!");
        return res.json(profile);
      }

      //Create
      profile = new Profile(profileFields);
      await profile.save();
      console.log("Profile Created !!");
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error!");
    }
  },
]);

//@route GET api/profile
//@desc Create or Update user profile
//@access private
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err);
    res.status(500).send({ msg: "Server Found !!" });
  }
});

//@route GET api/profile
//@desc Create or Update user profile
//@access private
router.get("/user/:userId", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.userId,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).send({ msg: "Profile not found!!" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    if (err.kind == "ObjectId") {
      return res.status(400).send({ msg: "Profile not found!!" });
    }
    res.status(500).send({ msg: "Server Found !!" });
  }
});

module.exports = router;
