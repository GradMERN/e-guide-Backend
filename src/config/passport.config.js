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
            const { displayName, emails, photos } = profile;
            const email = emails[0].value;

            const [firstName, ...lastNameParts] = displayName.split(" ");
            const lastName = lastNameParts.join(" ") || " ";

            let user = await User.findOne({ email });

            if (!user) {
            user = await User.create({
                firstName,
                lastName,
                email,
                avatar: photos[0]?.value || null,
                password: null, 
                loginMethod: "google",
            });
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
        }
    )
);
