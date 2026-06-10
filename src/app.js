const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const authRoutes = require("./modules/auth/auth.routes");
const venueRoutes = require("./modules/venues/venue.routes");
const bookingRoutes = require("./modules/bookings/booking.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/auth", authRoutes);
app.use("/venues", venueRoutes);
app.use("/bookings", bookingRoutes);

const bookingController = require("./modules/bookings/booking.controller");
const authMiddleware = require("./middlewares/auth.middleware");
app.get("/users/:id/bookings", authMiddleware, bookingController.getUserBookings);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Venue Booking API running",
  });
});

app.use(errorMiddleware);

module.exports = app;
