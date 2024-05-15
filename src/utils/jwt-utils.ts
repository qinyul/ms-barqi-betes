import jwt from "jsonwebtoken";

const generateToken = (payload: { email: string }) => {
  const secretKey = process.env.JWT_SECRET_KEY!;

  console.log("generateToken:: generating token ");
  const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });
  console.log("generateToken:: successfully generated token: ", token);
  return token;
};

export default generateToken;
