const express = require("express");
const passport = require("passport");

const router = express.Router();
const { googleCallback } = require("../controllers/oauth.controller");


router.get( "/auth/google",passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/auth/google/callback", (req, res, next) => {
    if (req.query.error) {return res.redirect("http://localhost:5173/login?error=cancelled");}
    passport.authenticate("google", { failureRedirect: "/login", session: false }, (err, user) => {
        if (err || !user) {
            return res.redirect("http://localhost:5173/login?error=failed");
        }
        req.user = user;
        googleCallback(req, res);
    })(req, res, next);
});