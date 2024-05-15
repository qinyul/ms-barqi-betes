import express from "express";
import authController from "../controllers/authController";

const router = express.Router();

router.post("/register", authController.register);
router.get("/user/:id", authController.getUserByPin);
router.patch("/user/:id", authController.updateUserById);
router.delete("/user/:id", authController.deleteUserById);
router.get("/user", authController.getUsers);
router.post("/login", authController.login);

export default router;
