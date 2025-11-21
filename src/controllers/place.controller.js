import Place from "../models/place.model.js";

export const createPlace = async (req, res) => {
  try {
    const place = await Place.create(req.body);
    res.status(201).json({ status: "success", data: place });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

export const getPlaces = async (req, res) => {
  try {
    const places = await Place.find();
    res
      .status(200)
      .json({ status: "success", results: places.length, data: places });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const getPlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place)
      return res.status(404).json({ status: "fail", message: "Not found" });
    res.status(200).json({ status: "success", data: place });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const updatePlace = async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!place)
      return res.status(404).json({ status: "fail", message: "Not found" });
    res.status(200).json({ status: "success", data: place });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

export const deletePlace = async (req, res) => {
  try {
    const place = await Place.findByIdAndDelete(req.params.id);
    if (!place)
      return res.status(404).json({ status: "fail", message: "Not found" });
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
