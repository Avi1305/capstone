import { verifyToken } from "../utils.js";

export function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
  req.user = decoded;
  next();
}
