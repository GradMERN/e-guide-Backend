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
  // Only allow enrollment on published tours
  if (!tour.isPublished) {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Cannot enroll: tour is not published",
    });
  }
  // Allow re-enrollment only when ALL previous enrollments for this user+tour are expired.
  // Fetch all enrollments for this user and tour and inspect their state.
  const existingEnrollments = await Enrollment.find({
    tour: tourId,
    user: userId,
  });
  if (existingEnrollments && existingEnrollments.length) {
    const enrollmentIds = existingEnrollments.map((e) => e._id);
    // If any paid payment exists for any of these enrollments, check whether that paid enrollment is still active (not expired).
    const paidPayments = await Payment.find({
      enrollment: { $in: enrollmentIds },
      status: "paid",
    }).select("enrollment");
    const now = Date.now();
    if (paidPayments && paidPayments.length) {
      const paidEnrollmentIds = new Set(
        paidPayments
          .map((p) => (p.enrollment ? p.enrollment.toString() : null))
          .filter(Boolean)
      );
      // If any paid enrollment is not expired, block re-enroll. If the paid enrollment has expired, allow re-enroll.
      const activePaidExists = existingEnrollments.some(
        (e) =>
          paidEnrollmentIds.has(e._id.toString()) &&
          (!e.expiresAt || e.expiresAt.getTime() > now)
      );
      if (activePaidExists) {
        return res.status(400).json({
          success: false,
          status: "fail",
          message: "You are already enrolled in this tour",
        });
      }
    }

    // If any existing enrollment is not expired, prevent creating a new one.
    // Treat enrollments with missing `expiresAt` as expired unless their status
    // is 'active' or 'started' (to avoid stale records blocking re-enrollment).
    const notExpired = existingEnrollments.filter((e) => {
      if (e.expiresAt) return e.expiresAt.getTime() > now;
      return e.status === "active" || e.status === "started";
    });
    if (notExpired.length) {
      // If any not-expired enrollment is pending (awaiting payment), return that enrollment id so frontend can continue payment.
      const pending = notExpired.find((e) => e.status === "pending");
      if (pending) {
        // return pending enrollment with populated tour (ensure mainImage present)
        const pendingPop = await Enrollment.findById(pending._id).populate(
          "tour",
          "name description place mainImage isPublished"
        );
        return res.status(200).json({
          success: true,
          status: "success",
          message: "Enrollment already exists and awaiting payment",
          data: { enrollment: pendingPop },
        });
      }

      // Otherwise, treat as already enrolled (active/started but without a paid payment record) and block.
      return res.status(400).json({
        success: false,
        status: "fail",
        message: "You are already enrolled in this tour",
      });
    }
    // If we get here, all previous enrollments exist but are expired -> allow creating a new enrollment
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
    const enrollmentPop = await Enrollment.findById(enrollment._id).populate(
      "tour",
      "name description place mainImage isPublished"
    );
    return res.status(201).json({
      success: true,
      status: "success",
      message: "Enrollment created (pending payment)",
      data: { enrollment: enrollmentPop, paymentId: payment._id },
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
  const enrollmentPop = await Enrollment.findById(enrollment._id).populate(
    "tour",
    "name description place mainImage isPublished"
  );
  res.status(201).json({
    success: true,
    status: "success",
    message: "Enrollment created — complete payment to start the tour",
    data: {
      enrollment: enrollmentPop,
      paymentId: payment._id,
      clientSecret: paymentIntent.client_secret,
    },
  });
});

export const getUserEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let enrollments = await Enrollment.find({ user: userId }).populate(
    "tour",
    "name description place mainImage guide isPublished"
  );
  // Ensure `tour.mainImage` is present on returned enrollments. Some populate hooks
  // elsewhere may limit fields; fetch missing mainImage values in batch to be safe.
  const tourIdsToFetch = [];
  enrollments.forEach((e) => {
    const t = e.tour;
    if (t && (!t.mainImage || !t.mainImage.url) && t._id) {
      tourIdsToFetch.push(t._id.toString());
    }
  });
  if (tourIdsToFetch.length) {
    const uniqueIds = [...new Set(tourIdsToFetch)];
    const tours = await Tour.find({ _id: { $in: uniqueIds } }).select(
      "mainImage name description place"
    );
    const tourMap = new Map(tours.map((t) => [t._id.toString(), t]));
    enrollments = enrollments.map((e) => {
      if (e.tour && tourMap.has(e.tour._id.toString())) {
        // merge mainImage and other available fields if missing
        const full = tourMap.get(e.tour._id.toString());
        e.tour.mainImage = e.tour.mainImage || full.mainImage || null;
        e.tour.name = e.tour.name || full.name;
        e.tour.description = e.tour.description || full.description;
        e.tour.place = e.tour.place || full.place;
      }
      return e;
    });
  }
  const paidPayments = await Payment.find({
    user: userId,
    status: "paid",
  }).select("enrollment");
  const paidEnrollmentIds = new Set(
    paidPayments
      .map((p) => (p.enrollment ? p.enrollment.toString() : null))
      .filter(Boolean)
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

// Start an active enrollment (mark as started)
export const startEnrollment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { enrollmentId } = req.params;

  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    user: userId,
  });
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      status: "fail",
      message: "Enrollment not found",
    });
  }

  if (enrollment.status !== "active") {
    return res.status(400).json({
      success: false,
      status: "fail",
      message: "Only active enrollments can be started",
    });
  }

  enrollment.status = "started";
  await enrollment.save();

  await Notification.create({
    user: userId,
    message: `Your enrollment for tour '${
      enrollment.tour?.name || ""
    }' has started. Enjoy the tour!`,
    type: "enrollment",
  });

  res.status(200).json({
    success: true,
    status: "success",
    message: "Enrollment started",
    data: enrollment,
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
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        const payment = await Payment.findOne({
          stripePaymentIntentId: session.id,
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
      }
      break;
    }
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
