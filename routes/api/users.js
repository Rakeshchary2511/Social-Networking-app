const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");

//@route Post api/users
//@desc Registration Route
//@access public
router.post(
  "/",
  [
    check("name", "Name is Required").not().isEmpty(),
    check("email", "Enter a Valid Email").isEmail(),
    check("password", "Enter a password of minimum length 6").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists !!" }] });
      }

      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      user.password = await bcrypt.hashSync(password, 10);

      await user.save();

      res.send("User Registered");

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          console.log(token);
          res.json(token);
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error !");
    }
  }
);
module.exports = router;
