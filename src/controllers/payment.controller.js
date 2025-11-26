import Payment from "../models/payment.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import Stripe from "stripe";
import Enrollment from "../models/enrollment.model.js";
import Tour from "../models/tour.model.js";
import Notification from "../models/notification.model.js";
import {
  paymentSuccessEmail,
  paymentStateChangeEmail,
} from "../utils/email-templates.util.js";
import { sendEmail } from "../utils/send-email.util.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const getUserPayments = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const payments = await Payment.find({ user: userId })
    .populate("tour", "name price")
    .populate("enrollment", "status createdAt");
  res
    .status(200)
    .json({ success: true, count: payments.length, data: payments });
});

export const initializePayment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userEmail = req.user.email;
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    user: userId,
  });
  if (!enrollment)
    return res
      .status(404)
      .json({ success: false, message: "Enrollment not found" });

  const tour = await Tour.findById(enrollment.tour);
  if (!tour)
    return res.status(404).json({ success: false, message: "Tour not found" });

  let payment = await Payment.findOne({ enrollment: enrollment._id });
  if (!payment) {
    payment = await Payment.create({
      user: userId,
      enrollment: enrollment._id,
      tour: tour._id,
      amount: tour.price || 0,
      currency: (process.env.PAYMENT_CURRENCY || "EGP").toUpperCase(),
      status: "pending",
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: (process.env.PAYMENT_CURRENCY || "EGP").toLowerCase(),
          product_data: { name: tour.name },
          unit_amount: Math.round(tour.price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
    metadata: {
      enrollmentId: enrollment._id.toString(),
      userId: userId.toString(),
      tourId: tour._id.toString(),
    },
  });

  payment.stripePaymentIntentId = session.id;
  await payment.save();

  await Notification.create({
    user: userId,
    message: `Enrollment created for tour '${tour.name}'. Complete payment to start the tour!`,
    type: "enrollment",
  });

  res.status(201).json({
    success: true,
    checkoutUrl: session.url,
    enrollmentId: enrollment._id,
    paymentId: payment._id,
  });
});

export const confirmPayment = asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId;
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === "paid") {
    const enrollmentId = session.metadata.enrollmentId;

    // Update payment
    const payment = await Payment.findOne({ enrollment: enrollmentId });
    if (payment) {
      payment.status = "paid";
      await payment.save();
    }

    // Update enrollment
    const enrollment = await Enrollment.findById(enrollmentId);
    if (enrollment) {
      enrollment.status = "active"; // or "in_progress"
      await enrollment.save();
    }

    return res.json({
      success: true,
      message: "Payment confirmed, enrollment active",
    });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Payment not completed" });
  }
});

export default {
  getUserPayments,
  initializePayment,
  confirmPayment,
};
