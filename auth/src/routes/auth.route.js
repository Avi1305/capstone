import { Router } from "express";
import User from "../models/user.model.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import { sendAuthNotification } from "../config/mq.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/",
  }),
  async (req, res) => {
    try {
      const { id, emails, photos, displayName } = req.user;
      let user = await User.findOne({ googleId: id });

      if (!user) {
        user = new User({
          googleId: id,
          email: emails[0].value,
          name: displayName,
          avatar: photos[0].value,
        });
        await user.save();
      }

      await sendAuthNotification({
        userId: user._id,
        action: "google_login",
        timestamp: new Date(),
        email: emails[0].value,
      });

      //Gnerate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "1h",
      });

      //set token in cookie
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          domain: "localhost",
          path: "/",
          maxAge: 1000 * 60 * 60,
        })
        .redirect("http://localhost:5173");
    } catch (error) {
      console.error("Error during Google authentication:", error);
      res.redirect("http://localhost:5173");
    }
  },
);

export default router;
