const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const authRoutes = require('./modules/auth/auth.routes');
const venueRoutes = require('./modules/venues/venue.routes');
const bookingRoutes = require('./modules/bookings/booking.routes');
const userRoutes = require('./modules/users/user.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');

const app = express();

app.use(helmet());
app.set("trust proxy", 1);
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Attach a unique request ID to every request for traceability
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Global rate limit on all API routes
app.use(apiLimiter);

app.use('/auth', authRoutes);
app.use('/venues', venueRoutes);
app.use('/bookings', bookingRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Venue Booking API running' });
});

app.use(errorMiddleware);

module.exports = app;
