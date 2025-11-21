import Tour from "../model/tour.model.js";
import APIFeatures from "../utils/apiFeatures.js";
import fs from "fs";
import path from "path";

export const createTour = async (req, res) => {
  try {
    const tour = await Tour.create(req.body);
    res.status(201).json({ status: "success", data: tour });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

export const getTours = async (req, res) => {
  try {
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;
    res
      .status(200)
      .json({ status: "success", results: tours.length, data: tours });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    if (!tour)
      return res.status(404).json({ status: "fail", message: "Not found" });
    res.status(200).json({ status: "success", data: tour });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.tourId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!tour)
      return res.status(404).json({ status: "fail", message: "Not found" });
    res.status(200).json({ status: "success", data: tour });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

export const deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.tourId);
    if (!tour)
      return res.status(404).json({ status: "fail", message: "Not found" });

    const dir = path.join(process.cwd(), "public", "tours", req.params.tourId);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });

    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const uploadTourImages = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    if (!tour)
      return res
        .status(404)
        .json({ status: "fail", message: "Tour not found" });

    if (req.files.mainImg)
      tour.mainImg = `/tours/${req.params.tourId}/${req.files.mainImg[0].filename}`;
    if (req.files.coverImgs) {
      tour.coverImgs.push(
        ...req.files.coverImgs.map(
          (f) => `/tours/${req.params.tourId}/cover-images/${f.filename}`
        )
      );
    }
    await tour.save();
    res.status(200).json({ status: "success", data: tour });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const deleteTourImage = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    if (!tour)
      return res
        .status(404)
        .json({ status: "fail", message: "Tour not found" });

    if (req.body.type === "main") {
      if (
        tour.mainImg &&
        fs.existsSync(path.join(process.cwd(), "public", tour.mainImg))
      ) {
        fs.unlinkSync(path.join(process.cwd(), "public", tour.mainImg));
      }
      tour.mainImg = null;
    } else {
      const idx = tour.coverImgs.indexOf(req.body.img);
      if (idx > -1) {
        if (
          fs.existsSync(path.join(process.cwd(), "public", tour.coverImgs[idx]))
        ) {
          fs.unlinkSync(
            path.join(process.cwd(), "public", tour.coverImgs[idx])
          );
        }
        tour.coverImgs.splice(idx, 1);
      }
    }

    await tour.save();
    res.status(200).json({ status: "success", data: tour });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
