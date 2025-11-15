import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import asyncHandler  from "../utils/async-error-wrapper.utils.js";
import { generateToken } from "../utils/jwt.utils.js";
import { ROLES } from "../utils/roles.utils.js";
import { sendEmail } from '../utils/send-email.util.js';
import {welcomeEmailTemplate, resetPasswordEmailTemplate, passwordResetSuccessTemplate} from '../utils/email-templates.util.js';

export const register = asyncHandler(async (req, res) => {
    const { firstName, lastName, age, phone, country, city, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(409).json({success: false, message: "Email already registered"});
    }
    let newUser;

    try {
        newUser = new User({
            firstName,
            lastName,
            age,
            phone,
            country,
            city,
            email,
            password,
            role: ROLES.USER,
            loginMethod: "local",
            isEmailVerified: false,
        });

        const verificationToken = newUser.generateEmailVerificationToken();
        await newUser.save();

        const verificationUrl = `${process.env.SERVER_URL}/api/auth/verify-email/${verificationToken}`;

        const emailContent = welcomeEmailTemplate(newUser.firstName, verificationUrl);

        await sendEmail({
            to: newUser.email,
            subject: emailContent.subject,
            message: emailContent.text,
            html: emailContent.html
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account',
            data: {
                id: newUser._id,
                firstName: newUser.firstName, 
                lastName: newUser.lastName,
                age: newUser.age,
                email: newUser.email,
                role: newUser.role,
                phone: newUser.phone,
                country: newUser.country,
                city: newUser.city,
                createdAt: newUser.createdAt,
                isEmailVerified: newUser.isEmailVerified,
            }
        });
    } catch (error) {
        await newUser.deleteOne();
        res.status(500).json({ success: false, message: error.message });
    }
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const emailVerificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ emailVerificationToken, emailVerificationExpire: { $gt: Date.now() } });

    if (!user) {
        return res.status(400).json({success: false, message: "Invalid or expired verification token"});
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now log in.',
        data: {
            id: user._id,
            firstName: user.firstName, 
            lastName: user.lastName,
            age: user.age,
            email: user.email,
            role: user.role,
            phone: user.phone,
            country: user.country,
            city: user.city,
            createdAt: user.createdAt,
            isEmailVerified: user.isEmailVerified,
            token
        }
    });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    let user;

    try {
        user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({success: true, message: 'If that email exists and is unverified, a verification email has been sent'});
        }

        if (user.isEmailVerified) {
            return res.status(400).json({success: false,message: 'Email is already verified'});
        }

        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        const verificationUrl =  `${process.env.SERVER_URL}/api/auth/verify-email/${verificationToken}`;
        const emailContent = welcomeEmailTemplate(user.firstName, verificationUrl);
        await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            message: emailContent.text,
            html: emailContent.html
        });

        res.status(200).json({success: true,message: 'Verification email sent successfully'});
    } catch (error) {
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();
        res.status(500).json({ success: false, message: error.message });
    }
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return res.status(401).json({success: false, message: "Invalid email or password"});
    }

    if (!user.isEmailVerified) {
        return res.status(403).json({success: false, message: "Please verify your email before logging in"});
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
        return res.status(401).json({success: false, message: "Invalid email or password"});
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({id: user._id, email: user.email, role: user.role });

    res.json({
        success: true,
        message: "Login successful",
        data: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            phone: user.phone,
            country: user.country,
            city: user.city,
            avatar: user.avatar,
            lastLogin: user.lastLogin,
            token,
        },
    });
});

export const forgetPassword  = asyncHandler(async(req ,res) =>{
    const { email } = req.body;
    const user = await User.findOne({ email }); 

    if(!user){return res.status(200).json({success: true, message:"If that email exists, a password reset link has been sent"});};

    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.SERVER_URL}/api/auth/reset-password/${resetToken}`;

    try {
        const emailContent = resetPasswordEmailTemplate(user.firstName, resetUrl);
        await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            message: emailContent.text,
            html: emailContent.html
        });

        res.status(200).json({success: true, message: 'Password reset link sent to your email'});
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(200).json({ success: true, data: user});
    }
})

export const resetPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({success: false,message: "Invalid or expired reset token"});
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    try {
        const emailContent = passwordResetSuccessTemplate(user.firstName);
        await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            message: emailContent.text,
            html: emailContent.html
        });
    } catch (error) {
        console.log('Failed to send confirmation email:', error);
    }

    res.status(200).json({success: true,message: 'Password reset successful. You can now log in with your new password'});
});