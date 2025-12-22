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
        const { displayName = "", emails = [], photos = [] } = profile;
        if (!emails.length)
          return done(new Error("No email found in Google profile"), null);

        const email = emails[0].value.toLowerCase();
        const [firstName = ""] = displayName.split(" ");
        const lastName = displayName.split(" ").slice(1).join(" ") || null;

        const avatarFromGoogle = photos[0]?.value
          ? { url: photos[0].value, public_id: null }
          : { url: null, public_id: null };

        let user = await User.findOne({ email }).select("+password");

        if (!user) {
          user = await User.create({
            firstName: firstName || "User",
            lastName: lastName,
            email,
            avatar: avatarFromGoogle,
            password: null,
            loginMethod: "google",
          });
        } else {
          if (user.loginMethod !== "google") {
            user.loginMethod = "google";
            if (!user.avatar?.url && photos[0]?.value) {
              user.avatar = avatarFromGoogle;
            }
            await user.save();
          } else {
            if (photos[0]?.value && user.avatar?.url !== photos[0].value) {
              user.avatar = avatarFromGoogle;
              await user.save();
            }
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
