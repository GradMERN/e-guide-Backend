import User from "../models/user.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import bcrypt from "bcrypt";


export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        return res.status(404).json({success: false,message: 'User not found'});
    }
    
    res.status(200).json({success: true, data: user});
});


export const updateProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, age, email, phone, country, city } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({success: false,message: 'User not found'});
    }

    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(409).json({success: false,message: "Email already in use"});
        }
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (age !== undefined) user.age = age;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (country) user.country = country;
    if (city) user.city = city;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
    });
});


export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
        return res.status(404).json({success: false,message: 'User not found'});
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return res.status(401).json({success: false,message: "Current password is incorrect"});
    }

    user.password = newPassword
    await user.save();

    res.status(200).json({success: true, message: "Password changed successfully"});
});


export const deleteMyAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({success: false,message: 'User not found'});
    }

    await user.deleteOne();

    res.status(200).json({ success: true,message: "Your account has been permanently deleted."});
});