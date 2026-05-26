import "dotenv/config";
import express from "express";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5173/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // Here you would typically find or create a user in your database
      // For simplicity, we'll just return the profile
      return done(null, profile);
    },
  ),
);

app.get("/status/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/status/readyz", (req, res) => {
  res.status(200).json({ status: "ready" });
});

app.use("/api/auth", authRoutes);

export default app;
