import express from "express";
import passport from "passport";
import googleCallback from "../controllers/oauth.controller.js";

const router = express.Router();

const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:5173";

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/auth/google/callback", (req, res, next) => {
  if (req.query.error) {
    return res.redirect(`${FRONTEND_URL}/login?error=cancelled`);
  }
  passport.authenticate(
    "google",
    { failureRedirect: "/login", session: false },
    (err, user) => {
      if (err || !user) {
        return res.redirect(`${FRONTEND_URL}/login?error=failed`);
      }
      req.user = user;
      googleCallback(req, res);
    }
  )(req, res, next);
});

export default router;
