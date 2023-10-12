const express = require('express');
const router = express.Router();
const passport = require("passport");
const catchAsync = require("../utils/catchAsync")
const { storeReturnTo } = require('../middleware');
const users = require("../controllers/users")

router.route("/register")
    .get(users.renderRegister)
    .post(catchAsync(users.register));

router.route("/login")
    .get(users.renderLogin)
    .post(storeReturnTo, passport.authenticate("local", {
        failureFlash: true, failureRedirect: "/login"
    }),
        (req, res) => {
            req.flash('success', 'Welcome back!');
            const redirectUrl = res.locals.returnTo || '/campgrounds';
            res.redirect(redirectUrl);
        });

router.get('/logout', users.logout);

module.exports = router