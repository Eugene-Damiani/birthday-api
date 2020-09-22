// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for s
const Profile = require('../models/profile')

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
router.get('/profile', requireToken, (req, res, next) => {
  Profile.find({owner: req.user.id})
    .then(profile => {
      // `s` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return profile.map(profile => profile.toObject())
    })
    // respond with status 200 and JSON of the s
    .then(profile => res.status(200).json({ profile: profile }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /s/5a7db6c74d55bc51bdf39793
router.get('/profile/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Profile.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "" JSON
    .then(profile => res.status(200).json({ profile: profile.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /s
router.post('/profile', requireToken, (req, res, next) => {
  // set owner of new  to be current user
  req.body.profile.owner = req.user.id

  // make get 'GET' request first to see if profile already exists
  Profile.find({ owner: req.user.id, name: req.body.profile.name }).limit(1)
    .then(checkProfileExist => {
      // if length === 1, that profile exists in database
      if (checkProfileExist.length === 1) {
        // so update that profile:
        return Profile.findOneAndUpdate({name: req.body.profile.name}, req.body.profile, {new: true})
      } else {
        // profile doesn't exist in database, so create/add profile to inventory:
        return Profile.create(req.body.profile)
      }
    })
  // respond to successful `create` with status 201 and JSON of new ""
    .then(profile => {
      res.status(201).json({ profile: profile.toObject() })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /s/5a7db6c74d55bc51bdf39793
router.patch('/profile/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.profile.owner

  Profile.findById(req.params.id)
    .then(handle404)
    .then(profile => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, profile)

      // pass the result of Mongoose's `.update` to the next `.then`
      return profile.updateOne(req.body.profile)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /s/5a7db6c74d55bc51bdf39793
router.delete('/profile/:id', requireToken, (req, res, next) => {
  Profile.findById(req.params.id)
    .then(handle404)
    .then(profile => {
      // throw an error if current user doesn't own ``
      requireOwnership(req, profile)
      // delete the  ONLY IF the above didn't throw
      profile.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
