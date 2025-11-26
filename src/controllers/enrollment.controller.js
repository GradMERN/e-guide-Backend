import Enrollment from "../models/enrollment.model.js";
import Tour from "../models/tour.model.js";
import asyncHandler from "../utils/async-error-wrapper.utils.js";
import Payment from "../models/payment.model.js";
import Stripe from "stripe";
import Notification from "../models/notification.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const enrollTour = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { tourId } = req.params;
  const tour = await Tour.findById(tourId);
  if (!tour)
    return res
      .status(404)
      .json({ success: false, status: "fail", message: "Tour not found" });
  const existingEnrollment = await Enrollment.findOne({
    tour: tourId,
    user: userId,
  });
  if (existingEnrollment) {
    const paidPayment = await Payment.findOne({
      enrollment: existingEnrollment._id,
      status: "paid",
    });
    if (paidPayment) {
      return res
        .status(400)
        .json({
          success: false,
          status: "fail",
          message: "You are already enrolled in this tour",
        });
    }
    return res.status(200).json({
      success: true,
      status: "success",
      message: "Enrollment already exists and awaiting payment",
      data: { enrollmentId: existingEnrollment._id },
    });
  }
  const enrollment = await Enrollment.create({
    tour: tourId,
    user: userId,
    status: "pending",
  });
  if (!process.env.STRIPE_SECRET_KEY) {
    const payment = await Payment.create({
      user: userId,
      enrollment: enrollment._id,
      tour: tourId,
      status: "pending",
      amount: tour.price || 0,
    });
    await Notification.create({
      user: userId,
      message: `Enrollment created for tour '${tour.name}'. Complete payment to start the tour!`,
      type: "enrollment",
    });
    return res.status(201).json({
      success: true,
      status: "success",
      message: "Enrollment created (pending payment)",
      data: { enrollmentId: enrollment._id, paymentId: payment._id },
    });
  }
  const amount = Math.round((tour.price || 0) * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: (process.env.PAYMENT_CURRENCY || "EGP").toLowerCase(),
    metadata: {
      enrollmentId: enrollment._id.toString(),
      userId: userId.toString(),
      tourId: tourId.toString(),
    },
  });
  const payment = await Payment.create({
    user: userId,
    enrollment: enrollment._id,
    tour: tourId,
    amount: tour.price || 0,
    currency: (process.env.PAYMENT_CURRENCY || "EGP").toUpperCase(),
    stripePaymentIntentId: paymentIntent.id,
    status: "pending",
  });
  await Notification.create({
    user: userId,
    message: `Enrollment created for tour '${tour.name}'. Complete payment to start the tour!`,
    type: "enrollment",
  });
  res.status(201).json({
    success: true,
    status: "success",
    message: "Enrollment created — complete payment to start the tour",
    data: {
      enrollmentId: enrollment._id,
      paymentId: payment._id,
      clientSecret: paymentIntent.client_secret,
    },
  });
});

export const getUserEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const enrollments = await Enrollment.find({ user: userId }).populate(
    "tour",
    "name description place coverImgs"
  );
  const paidPayments = await Payment.find({
    user: userId,
    status: "paid",
  }).select("enrollment");
  const paidEnrollmentIds = new Set(
    paidPayments.map((p) => p.enrollment.toString())
  );
  const inProgress = enrollments.filter((e) => e.status === "started");
  const available = enrollments.filter(
    (e) => e.status !== "started" && paidEnrollmentIds.has(e._id.toString())
  );
  res.status(200).json({
    success: true,
    status: "success",
    count: enrollments.length,
    data: { all: enrollments, inProgress, available },
  });
});

export const stripeWebhookHandler = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });
      if (payment) {
        payment.status = "paid";
        await payment.save();
        const enrollment = await Enrollment.findById(payment.enrollment);
        if (enrollment) {
          enrollment.status = "active";
          if (!enrollment.expiresAt) {
            enrollment.expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
          }
          await enrollment.save();
        }
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });
      if (payment) {
        payment.status = "failed";
        await payment.save();
      }
      break;
    }
    default:
  }
  res.status(200).json({ received: true });
});
