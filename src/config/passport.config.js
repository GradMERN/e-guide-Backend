import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(profile);
        const { displayName = "", emails = [], photos = [] } = profile;
        if (!emails.length)
          return done(new Error("No email found in Google profile"), null);

        const email = emails[0].value.toLowerCase();
        const [firstName = ""] = displayName.split(" ");
        const lastName = displayName.split(" ").slice(1).join(" ") || null;

        // Convert Google photo URL to avatar object format
        const avatarFromGoogle = photos[0]?.value
          ? { url: photos[0].value, public_id: null }
          : { url: null, public_id: null };

        // Try to find existing user (include password field if present)
        let user = await User.findOne({ email }).select("+password");

        if (!user) {
          // New user created from Google profile
          user = await User.create({
            firstName: firstName || "User",
            lastName: lastName,
            email,
            avatar: avatarFromGoogle,
            password: null,
            loginMethod: "google",
          });
        } else {
          // Existing user found. If they previously registered with local
          // password, we mark the account as Google-linked so Google auth
          // will be accepted. We do not forcefully remove the password to
          // avoid breaking local logins; adjust if you want to nullify.
          if (user.loginMethod !== "google") {
            user.loginMethod = "google";
            // Optionally update avatar from Google if not set
            if (!user.avatar?.url && photos[0]?.value) {
              user.avatar = avatarFromGoogle;
            }
            await user.save();
          } else {
            // If already google-linked, ensure avatar is up-to-date
            if (photos[0]?.value && user.avatar?.url !== photos[0].value) {
              user.avatar = avatarFromGoogle;
              await user.save();
            }
          }
        }

        return done(null, user);
      } catch (err) {
        console.log(err);
        return done(err, null);
      }
    }
  )
);
