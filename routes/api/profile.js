const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const { check, validationResult } = require("express-validator");
const request = require("request");
const config = require("config");

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

//@route POST api/profile
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
      githubusername,
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
    if (location) profileFields.location = location;
    if (githubusername) profileFields.githubusername = githubusername;
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
    res.status(500).send("Server Error !!");
  }
});

//@route GET api/profile
//@desc Gete user profile by user Id
//@access private
router.get("/user/:user_id", async ({ params: { user_id } }, res) => {
  try {
    const profile = await Profile.findOne({
      user: user_id,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).send("Profile not found!!");
    }
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).send("Profile not found!!");
    }
    return res.status(500).send("Server Error !!");
  }
});

//@route DELETE api/profile
//@desc Delete User & profile
//@access private
router.delete("/", auth, async (req, res) => {
  try {
    //@todo - remove users posts

    //Remove Profile of User!!
    await Profile.findOneAndDelete({ user: req.user.id });

    //Remove User
    await User.findOneAndDelete({ _id: req.user.id });

    res.json({ msg: "User Deleted !!" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ msg: " Server Error !!" });
  }
});

//@route PUT api/profile/experience
//@desc  Update users profile
//@access private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required !!").not().isEmpty(),
      check("company", "Company is required !!").not().isEmpty(),
      check("from", "From date is required !!").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(400).send({ msg: "Profile not found!!" });
      }

      profile.experience.push(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).send(" Server Error !!");
    }
  }
);

//@route DELETE api/profile/experience/:exp_id
//@desc Delete Users Profile Experience
//@access private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(400).send({ msg: "Profile not found!!" });
    }

    const removeIndex = await profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send(" Server Error !!");
  }
});

//@route PUT api/profile/education
//@desc  Update users profile/education
//@access private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required !!").not().isEmpty(),
      check("degree", "Degree is required !!").not().isEmpty(),
      check("fieldofstudy", "FieldofStudy is required !!").not().isEmpty(),
      check("from", "From date is required !!").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(400).send({ msg: "Profile not found!!" });
      }

      profile.education.push(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).send(" Server Error !!");
    }
  }
);

//@route DELETE api/profile/experience/:exp_id
//@desc Delete Users Profile Experience
//@access private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(400).send({ msg: "Profile not found!!" });
    }

    const removeIndex = await profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send(" Server Error !!");
  }
});

//@route GET api/profile/github/:username
//@desc Get repos from github
//@access public
router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubClientSecret")}`,
      method: "GET",
      header: { "user-agent": "node.js" },
    };
    request(options, (error, response, body) => {
      if (error) console.error(error);
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "No Github Profile found !!" });
      }
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(" Server Error !!");
  }
});

module.exports = router;
