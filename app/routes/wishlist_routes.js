// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for s
const Wishlist = require('../models/wishlist')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { : { title: '', text: 'foo' } } -> { : { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /s
router.get('/wishlists', requireToken, (req, res, next) => {
  Wishlist.find({owner: req.user.id})
    .then(wishlists => {
      // `s` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return wishlists.map(wishlist => wishlist.toObject())
    })
    // respond with status 200 and JSON of the s
    .then(wishlists => res.status(200).json({ wishlists: wishlists }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /s/5a7db6c74d55bc51bdf39793
router.get('/wishlists/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Wishlist.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "" JSON
    .then(wishlist => res.status(200).json({ wishlist: wishlist.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /s
router.post('/wishlists', requireToken, (req, res, next) => {
  // set owner of new  to be current user
  req.body.wishlist.owner = req.user.id

  // make get 'GET' request first to see if wishlist already exists
  Wishlist.find({ owner: req.user.id, name: req.body.wishlist.name }).limit(1)
    .then(checkWishlistExist => {
      // if length === 1, that wishlist exists in database
      if (checkWishlistExist.length === 1) {
        // so update that wishlist:
        return Wishlist.findOneAndUpdate({name: req.body.wishlist.name}, req.body.wishlist, {new: true})
      } else {
        // wishlist doesn't exist in database, so create/add wishlist to inventory:
        return Wishlist.create(req.body.wishlist)
      }
    })
  // respond to successful `create` with status 201 and JSON of new ""
    .then(wishlist => {
      res.status(201).json({ wishlist: wishlist.toObject() })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /s/5a7db6c74d55bc51bdf39793
router.patch('/wishlists/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.wishlist.owner

  Wishlist.findById(req.params.id)
    .then(handle404)
    .then(wishlist => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, wishlist)

      // pass the result of Mongoose's `.update` to the next `.then`
      return wishlist.updateOne(req.body.wishlist)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /s/5a7db6c74d55bc51bdf39793
router.delete('/wishlists/:id', requireToken, (req, res, next) => {
  Wishlist.findById(req.params.id)
    .then(handle404)
    .then(wishlist => {
      // throw an error if current user doesn't own ``
      requireOwnership(req, wishlist)
      // delete the  ONLY IF the above didn't throw
      wishlist.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
