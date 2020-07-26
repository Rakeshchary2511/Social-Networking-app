const express = require("express");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const request = require("request");
const router = express.Router();

const auth = require("../../middleware/auth");

const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const { json } = require("express");

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

//@route PUT api/post/like/:id
//@desc Like a post
//@access private
router.put("/like/:id", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ msg: "Post not find!" });
  }

  if (
    post.likes.filter((like) => like.user.toString() == req.user.id).length > 0
  ) {
    return res.status(400).json({ msg: "Post was already liked!!" });
  }

  post.likes.unshift({ user: req.user.id });
  await post.save();

  res.json(post.likes);
});

//@route PUT api/post/unlike/:id
//@desc Dislike a post
//@access private
router.put("/unlike/:id", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ msg: "Post not find!" });
  }

  if (
    post.likes.filter((like) => like.user.toString() == req.user.id).length ===
    0
  ) {
    return res.status(400).json({ msg: "Post has not yet been liked!!" });
  }

  const removeIndex = post.likes.map((like) =>
    like.user.toString().indexOf(req.user.id)
  );

  post.likes.splice(removeIndex, 1);
  await post.save();

  res.json(post.likes);
});

//@route POST api/posts/comment/id
//@desc post newComment
//@access private
router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required !!").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);

      const newComment = {
        name: user.name,
        avatar: user.avatar,
        text: req.body.text,
        user: req.user.id,
        date: new Date(),
      };
      post.comments.unshift(newComment);
      post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err);
      res.status(500).send(" Server Error !!");
    }
  }
);

//@route DELETE api/posts/comment/:postId/:commentId
//@desc Delete Post by ID
//@access private
router.delete("/comment/:postId/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not find!" });
    }
    //Pull out Comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.commentId
    );

    //Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist !!" });
    }

    //Make sure comment belongs to same user who posted it
    if (comment.user.toString() !== req.user.id) {
      return res.status(400).json({ msg: "You are not Authorized !!" });
    }

    const removeIndex = post.comments.map((comment) =>
      comment.user.toString().indexOf(req.user.id)
    );

    post.comments.splice(removeIndex, 1);
    await post.save();

    res.json(post.comments);
  } catch (err) {
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "Post not find!" });
    }
    console.error(err);
    res.status(500).send(" Server Error !!");
  }
});

module.exports = router;
