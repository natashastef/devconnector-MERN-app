const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//load Post Model
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

//Validation
const validatePostInput = require('../../validation/post');
//@route   GET api/posts/test
//@desc    Test post route
//@acess   Public
router.get('/test', (req, res) => res.json({ msg: 'Posts works!' }));

//@route   GET api/posts
//@desc    Get post
//@acess   Public
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ postsnotexist: 'No Posts found' }));
});

//@route   GET api/posts/:id
//@desc    Get post by id
//@acess   Public
router.get('/:id', (req, res) => {
  const errors = {};
  //   Post.findById(req.params.id)
  //     .then(post => res.json(post))
  //     .catch(err => res.status(404).json(err));
  Post.findOne({ _id: req.params.id })
    .then(post => res.json(post))
    .catch(err => res.json({ postnotexist: 'Post not found' }));
});

//@route   POST api/posts
//@desc    Create post
//@acess   Public
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      //If any errors, send 400 with errors object
      res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    newPost.save().then(post => res.json(post));
  }
);

//@route   DELETE api/posts/:id
//@desc    Delete post by id
//@acess   Private
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //Check for post owner
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notauthorized: 'User not authorized' });
          }

          //Delete
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(() =>
          res.status(404).json({ postnotfound: "Post doesn't exist" })
        );
    });
  }
);

//@route   POST api/posts/like/:id
//@desc    Like Post
//@acess   Private
router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            res
              .status(400)
              .json({ alreadyliked: 'User already liked this post' });
          }

          //Add the user id to the likes array
          post.likes.push({ user: req.user.id });

          post.save().then(post => res.json(post));
        })
        .catch(() =>
          res.status(404).json({ postnotfound: "Post doesn't exist" })
        );
    });
  }
);

//@route   POST api/posts/like/:id
//@desc    Unlike a Post
//@acess   Private
router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length == 0
          ) {
            res
              .status(400)
              .json({ notliked: 'I have not yet liked this post' });
          }

          const removedIndex = post.likes
            .map(item => item.user.toString())
            //get the index of the current user
            .indexOf(req.user.id);

          //splica out of array
          post.likes.splice(removedIndex, 1);

          //save to the database
          post.save().then(post => res.json(post));
        })
        .catch(() =>
          res.status(404).json({ postnotfound: "Post doesn't exist" })
        );
    });
  }
);

//@route   POST api/posts/comment/:id (post id)
//@desc    Unlike a Post
//@acess   Private
module.exports = router;
