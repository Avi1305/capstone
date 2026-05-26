import jwt from 'jsonwebtoken';

export function verifyToken(token){
    try {
        return jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
        console.error("Error verifying token:", error);
        return null;
    }
}