const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");

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
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.send("Users Router");
  }
);
module.exports = router;
