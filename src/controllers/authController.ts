import { Request, Response } from "express";

import User from "../models/User";
import authService from "../services/authService";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { verify } from "jsonwebtoken";
import { createRedisClient } from "../services/cached";

const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    console.log("register:: Starting create user");
    const encryptedPassword = await bcrypt.hash(password, 10);
    const accountNumber = randomUUID();
    const identityNumber = randomUUID();
    const user = await User.create({
      username,
      email,
      password: encryptedPassword,
      accountNumber,
      identityNumber,
    });
    res.json(user);
  } catch (err: any) {
    console.error("register:: err:", err?.message);
    res.status(500).json({ err: err?.message });
  }
};

const getUserByPin = async (req: Request, res: Response) => {
  try {
    const { headers, params } = req;
    const { id } = params;
    const { authorization } = headers;
    console.log(
      `getUserByPIN:: get user for account number / identity number: ${id}`
    );
    verify(authorization!, process.env.JWT_SECRET_KEY!);

    let user = await User.findOne({ accountNumber: id });
    if (!user) {
      user = await User.findOne({ identityNumber: id });
    }
    if (!user) {
      return res.status(404).json({
        error: `user with account number / identity number ${id} not found`,
      });
    }

    res.json(user);
  } catch (err: any) {
    console.error("getUserByPIN:: err:", err?.message);
    res.status(500).json({ err: err?.message });
  }
};

const updateUserById = async (req: Request, res: Response) => {
  try {
    const { headers, params, body } = req;
    const { id } = params;
    const { authorization } = headers;
    const { email = undefined, username = undefined } = body;
    verify(authorization!, process.env.JWT_SECRET_KEY!);
    console.log(`updateUserById:: updating user for id: ${id}`);

    const payload = {
      ...(email && { email }),
      ...(username && { username }),
    };
    const updating = await User.findByIdAndUpdate(id, payload);
    if (!updating) {
      return res.status(404).json({ error: "users not found" });
    }

    const user = await User.findById(id);

    res.json(user);
  } catch (err: any) {
    console.error("updateUserById:: err:", err?.message);
    res.status(500).json({ err: err?.message });
  }
};

const deleteUserById = async (req: Request, res: Response) => {
  try {
    const { headers, params } = req;
    const { id } = params;
    const { authorization } = headers;
    verify(authorization!, process.env.JWT_SECRET_KEY!);
    console.log(`deleteUserById:: deleting user for id: ${id}`);

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "users not found" });
    }

    res.json({ message: `user with id ${id} sucessfully deleted` });
  } catch (err: any) {
    console.error("deleteUserById:: err:", err?.message);
    res.status(500).json({ err: err?.message });
  }
};

const getUsers = async (req: Request, res: Response) => {
  try {
    const { headers } = req;
    const { authorization } = headers;
    verify(authorization!, process.env.JWT_SECRET_KEY!);
    console.log("getUsers:: getting all users");

    const cacheKey = "GET_USERS";
    const users = await (
      await createRedisClient()
    ).getCachedData(
      cacheKey,
      async () => await User.find(),
      Number(process.env.CACHE_TTL)
    );

    if (!users) {
      return res.status(404).json({ error: "users not found" });
    }

    res.json(users);
  } catch (err: any) {
    console.error("getUsers:: err:", err?.message);
    res.status(500).json({ err: err?.message });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("login:: Starting login user");
    const token = await authService.authenticateUser(email, password);
    res.json({ token });
  } catch (err: any) {
    console.error("login:: err:", err?.message);
    res.status(500).json({ err: err?.message });
  }
};

export default {
  register,
  login,
  getUserByPin,
  getUsers,
  updateUserById,
  deleteUserById,
};
