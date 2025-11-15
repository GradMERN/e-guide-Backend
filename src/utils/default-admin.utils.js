import dotenv from "dotenv";
dotenv.config();

import User from "../models/user.model.js";
import asyncHandler from "./async-error-wrapper.utils.js";
import { ROLES } from "./roles.utils.js";




const defaultAdmin = asyncHandler(async () => {

    const adminExists = await User.findOne({ role: ROLES.ADMIN });
    if (adminExists) return;

    const admin = new User({
        firstName: process.env.ADMIN_FIRST_NAME,
        lastName: process.env.ADMIN_LAST_NAME,
        age: process.env.ADMIN_AGE,
        email: process.env.ADMIN_EMAIL,
        phone: process.env.ADMIN_PHONE,
        country: process.env.ADMIN_COUNTRY,
        city: process.env.ADMIN_CITY,
        password: process.env.ADMIN_PASSWORD,
        role: ROLES.ADMIN,
        loginMethod: "local",
    });

    await admin.save();

});


export default defaultAdmin;