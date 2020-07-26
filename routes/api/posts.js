const express = require("express");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const request = require("request");
const router = express.Router();

const auth = require("../../middleware/auth");

const Post = require("../../models/Post");
const Profile = require("../../models/Profile");

//@route GET api/post
//@desc GEt all posts
//@access private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).send(" Server Error !!");
  }
});

//@route GET api/post
//@desc GEt post by id
//@access private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not find!" });
    }
    res.json(post);
  } catch (err) {
    console.error(err);
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "Post not find!" });
    }
    res.status(500).send(" Server Error !!");
  }
});

//@route POST api/post
//@desc post newPost
//@access private
router.post(
  "/",
  [auth, [check("text", "Text is required !!").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        name: user.name,
        avatar: user.avatar,
        text: req.body.text,
        user: req.user.id,
      });
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err);
      res.status(500).send(" Server Error !!");
    }
  }
);

//@route DELETE api/post
//@desc Delete Post by ID
//@access private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not find!" });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(400).json({ msg: "You are not Authorized !!" });
    }

    await post.remove();
    res.json({ msg: "Post Deleted !!" });
  } catch (err) {
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "Post not find!" });
    }
    console.error(err);
    res.status(500).send(" Server Error !!");
  }
});
module.exports = router;
