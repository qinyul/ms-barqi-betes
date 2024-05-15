import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();
const { PORT, MONGODB_URI } = process.env;

mongoose
  .connect(MONGODB_URI!)
  .then(() => console.log("Connected to MongoDb"))
  .catch((err) => console.error("Connection MongoDb Error: ", err));

app.use(express.json());
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server Running on PORT ${PORT}`);
});

export default app;
