import Payment from "../models/payment.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import Stripe from "stripe";
import Enrollment from "../models/enrollment.model.js";
import Notification from "../models/notification.model.js";
import {
  paymentSuccessEmail,
  paymentExpiredEmail,
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

// Create a payment intent for an existing enrollment
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findById(enrollmentId).populate(
    "tour",
    "price name"
  );
  if (!enrollment)
    return res
      .status(404)
      .json({ success: false, message: "Enrollment not found" });
  if (enrollment.user.toString() !== userId.toString())
    return res.status(403).json({ success: false, message: "Unauthorized" });

  const tour = enrollment.tour;
  if (!tour)
    return res
      .status(400)
      .json({ success: false, message: "Enrollment has no associated tour" });

  const amount = Math.round((tour.price || 0) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: (process.env.PAYMENT_CURRENCY || "egp").toLowerCase(),
    metadata: {
      enrollmentId: enrollment._id.toString(),
      userId: userId.toString(),
      tourId: tour._id.toString(),
    },
  });

  // Create or update Payment record
  let payment = await Payment.findOne({ enrollment: enrollment._id });
  if (!payment) {
    payment = await Payment.create({
      user: userId,
      enrollment: enrollment._id,
      tour: tour._id,
      amount: tour.price || 0,
      currency: (process.env.PAYMENT_CURRENCY || "EGP").toUpperCase(),
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
    });
  } else {
    payment.stripePaymentIntentId = paymentIntent.id;
    payment.status = "pending";
    await payment.save();
  }

  res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    paymentId: payment._id,
  });
});

// Stripe webhook to update payment & enrollment status
export const stripeWebhookHandler = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      // When using express.raw on the webhook route, req.body is the raw Buffer
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // If webhook secret not configured, parse body directly (less secure)
      event = req.body;
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const type = event.type || event.type;

  if (type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const intentId = pi.id;
    const payment = await Payment.findOne({
      stripePaymentIntentId: intentId,
    }).populate("user tour");
    if (payment) {
      payment.status = "paid";
      await payment.save();

      const enrollment = await Enrollment.findById(payment.enrollment);
      if (enrollment) {
        enrollment.status = "in_progress";
        await enrollment.save();
      }

      // Send email and notification
      const emailContent = paymentSuccessEmail(
        payment.user.firstName,
        payment.tour.name,
        payment.amount
      );
      await sendEmail({
        to: payment.user.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
      await Notification.create({
        user: payment.user._id,
        message: `Payment successful for tour '${payment.tour.name}'.`,
        type: "payment",
      });
    }
  }

  if (type === "payment_intent.payment_failed") {
    const pi = event.data.object;
    const intentId = pi.id;
    const payment = await Payment.findOne({
      stripePaymentIntentId: intentId,
    }).populate("user tour");
    if (payment) {
      payment.status = "failed";
      await payment.save();
      // Send email and notification
      const emailContent = paymentStateChangeEmail(
        payment.user.firstName,
        payment.tour.name,
        "failed"
      );
      await sendEmail({
        to: payment.user.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
      await Notification.create({
        user: payment.user._id,
        message: `Payment failed for tour '${payment.tour.name}'.`,
        type: "payment",
      });
    }
  }

  res.json({ received: true });
});

export default { getUserPayments, createPaymentIntent, stripeWebhookHandler };
