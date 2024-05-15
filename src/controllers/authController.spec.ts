import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import User from "../models/User";
import { verify } from "jsonwebtoken";
import authController from "./authController";
import { createRedisClient } from "../services/cached";
import authService from "../services/authService";

jest.mock("bcryptjs");
jest.mock("crypto");
jest.mock("../models/User");
jest.mock("jsonwebtoken");
jest.mock("../services/cached");
jest.mock("../services/authService");

const mocked = jest.mocked;

const mockRes = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
} as unknown as Response;
const jwtSecret = "dummy-jwt-secret";
const cacheTTL = 5000;
const errorMessage = "some error message";
const errorObject = { err: errorMessage };

describe("authController", () => {
  const ENV = { ...process.env };
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    process.env = ENV;
    process.env.JWT_SECRET_KEY = jwtSecret;
    process.env.CACHE_TTL = `${cacheTTL}`;
  });

  describe("register function", () => {
    const mockReq = {
      body: {
        username: "test",
        email: "test@mail.com",
        password: "1243",
      },
    } as Request;

    it("should create a new user", async () => {
      const mockEncryptedPassword = "mockEncryptedPassword";
      const mockAccountNumber = "mockAccountNumber";
      const mockIdentityNumber = "mockIdentityNumber";
      const mockUser = {
        _id: "mockId",
        username: "test",
        email: "test@mail.com",
      };

      mocked(bcrypt.hash as any).mockResolvedValue(mockEncryptedPassword);
      mocked(randomUUID as any)
        .mockReturnValueOnce(mockAccountNumber)
        .mockReturnValueOnce(mockIdentityNumber);
      mocked(User.create as any).mockResolvedValue(mockUser);

      await authController.register(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.password, 10);
      expect(randomUUID).toHaveBeenCalledTimes(2);
      expect(User.create).toHaveBeenCalledWith({
        username: mockReq.body.username,
        email: mockReq.body.email,
        password: mockEncryptedPassword,
        accountNumber: mockAccountNumber,
        identityNumber: mockIdentityNumber,
      });

      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should handle errors", async () => {
      const mockError = new Error("Test Error Message");
      mocked(bcrypt.hash as any).mockRejectedValue(mockError);
      await authController.register(mockReq, mockRes);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockReq.body.password, 10);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ err: "Test Error Message" });
    });
  });

  describe("get user by PIN function", () => {
    const accountNumber = "123";
    const username = "test";
    const identityNumber = "123";
    const mockReq = {
      headers: {
        authorization: "Bearer  testToken",
      },
      params: {
        id: accountNumber,
      },
    } as unknown as Request;

    it("should return user if found by account number", async () => {
      const mockUser = { accountNumber, username };
      mocked(verify).mockReturnValueOnce(undefined);
      mocked(User.findOne).mockResolvedValueOnce(mockUser);
      await authController.getUserByPin(mockReq, mockRes);
      expect(verify).toHaveBeenCalledWith(
        mockReq.headers.authorization,
        jwtSecret
      );
      expect(User.findOne).toHaveBeenCalledWith({
        accountNumber,
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return user if found by identity number", async () => {
      mocked(User.findOne).mockResolvedValueOnce(null); // check user by account number and return null
      const mockUser = { identityNumber, username };
      mocked(User.findOne).mockResolvedValueOnce(mockUser);
      await authController.getUserByPin(mockReq, mockRes);
      expect(verify).toHaveBeenCalledWith(
        mockReq.headers.authorization,
        jwtSecret
      );
      expect(User.findOne).toHaveBeenNthCalledWith(1, { accountNumber });
      expect(User.findOne).toHaveBeenNthCalledWith(2, { identityNumber });
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 if user not found", async () => {
      mocked(User.findOne).mockResolvedValueOnce(null); // search by acc number not found
      mocked(User.findOne).mockResolvedValueOnce(null); // search by identity number not found
      await authController.getUserByPin(mockReq, mockRes);
      expect(verify).toHaveBeenCalledWith(
        mockReq.headers.authorization,
        jwtSecret
      );
      expect(User.findOne).toHaveBeenNthCalledWith(1, { accountNumber });
      expect(User.findOne).toHaveBeenNthCalledWith(2, { identityNumber });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "user with account number / identity number 123 not found",
      });
    });

    it("should handle errors and return 500", async () => {
      mocked(verify).mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });
      await authController.getUserByPin(mockReq, mockRes);
      expect(verify).toHaveBeenCalledWith(
        mockReq.headers.authorization,
        jwtSecret
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(errorObject);
    });
  });

  describe("updateUserById", () => {
    const mockReq = {
      headers: {
        authorization: "Bearer testToken",
      },
      params: {
        id: "testId",
      },
      body: {
        email: "test@example.com",
        username: "testUser",
      },
    } as unknown as Request;

    const mockUser = {
      _id: "testId",
      email: "test@example.com",
      username: "testUser",
    };
    const { _id, ...resMockUser } = mockUser;

    it("should update user if found and return updated user", async () => {
      mocked(User.findByIdAndUpdate).mockResolvedValueOnce(mockUser);
      mocked(User.findById).mockResolvedValueOnce(mockUser);
      await authController.updateUserById(mockReq, mockRes);
      expect(verify).toHaveBeenCalledWith(
        mockReq.headers.authorization,
        jwtSecret
      );
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(_id, resMockUser);
      expect(User.findById).toHaveBeenCalledWith(_id);
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 if user is not found", async () => {
      mocked(User.findByIdAndUpdate).mockResolvedValueOnce(null);
      await authController.updateUserById(mockReq, mockRes);
      expect(verify).toHaveBeenCalledWith(
        mockReq.headers.authorization,
        jwtSecret
      );
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(_id, resMockUser);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "users not found" });
    });

    it("should handle errors and return 500", async () => {
      mocked(User.findByIdAndUpdate).mockImplementation(() => {
        throw new Error(errorMessage);
      });
      await authController.updateUserById(mockReq, mockRes);
      expect(verify).toHaveBeenCalledWith(
        mockReq.headers.authorization,
        jwtSecret
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(errorObject);
    });
  });

  describe("deleteUserById", () => {
    const mockReq = {
      headers: {
        authorization: "Bearer testToken",
      },
      params: {
        id: "testId",
      },
    } as unknown as Request;

    it("should delete user if found and return success message", async () => {
      const mockUser = {
        _id: "testId",
        username: "test",
        email: "test@mail.com",
      };
      mocked(User.findByIdAndDelete).mockResolvedValueOnce(mockUser);
      await authController.deleteUserById(mockReq, mockRes);

      expect(verify).toHaveBeenCalledWith("Bearer testToken", jwtSecret);
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: `user with id ${mockUser._id} sucessfully deleted`,
      });
    });

    it("should return 404 if user is not found", async () => {
      mocked(User.findByIdAndDelete).mockResolvedValueOnce(null);
      await authController.deleteUserById(mockReq, mockRes);

      expect(verify).toHaveBeenCalledWith("Bearer testToken", jwtSecret);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "users not found" });
    });

    it("should handle errors and return 500", async () => {
      const errMessage = "some error";
      mocked(User.findByIdAndDelete).mockImplementationOnce(() => {
        throw new Error(errMessage);
      });
      await authController.deleteUserById(mockReq, mockRes);

      expect(verify).toHaveBeenCalledWith("Bearer testToken", jwtSecret);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ err: errMessage });
    });
  });

  describe("getUsers", () => {
    const getCachedData = jest.fn();
    const mockUsers = [{ username: "user1" }, { username: "user2" }];
    const mockReq = {
      headers: {
        authorization: "Bearer testToken",
      },
    } as unknown as Request;
    beforeEach(() => {
      mocked(createRedisClient).mockResolvedValueOnce({ getCachedData });
    });

    it("should return all users from cache", async () => {
      getCachedData.mockResolvedValueOnce(mockUsers);
      await authController.getUsers(mockReq, mockRes);

      expect(verify).toHaveBeenCalledWith("Bearer testToken", jwtSecret);
      expect(getCachedData).toHaveBeenCalledWith(
        "GET_USERS",
        expect.any(Function),
        cacheTTL
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should return 404 if users not found", async () => {
      getCachedData.mockResolvedValueOnce(null);
      await authController.getUsers(mockReq, mockRes);

      expect(verify).toHaveBeenCalledWith("Bearer testToken", jwtSecret);
      expect(getCachedData).toHaveBeenCalledWith(
        "GET_USERS",
        expect.any(Function),
        cacheTTL
      );
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "users not found" });
    });

    it("should handle errors", async () => {
      getCachedData.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });
      await authController.getUsers(mockReq, mockRes);

      expect(verify).toHaveBeenCalledWith("Bearer testToken", jwtSecret);
      expect(getCachedData).toHaveBeenCalledWith(
        "GET_USERS",
        expect.any(Function),
        cacheTTL
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(errorObject);
    });
  });

  describe("login", () => {
    const mockReq = {
      body: {
        email: "test@example.com",
        password: "password123",
      },
    } as unknown as Request;

    it("should return a token if authentication is successful", async () => {
      const token = "mockToken";
      mocked(authService.authenticateUser).mockResolvedValueOnce(token);

      await authController.login(mockReq, mockRes);
      expect(authService.authenticateUser).toHaveBeenCalledWith(
        mockReq.body.email,
        mockReq.body.password
      );
      expect(mockRes.json).toHaveBeenCalledWith({ token });
    });

    it("should handle errors during authentication", async () => {
      mocked(authService.authenticateUser).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      await authController.login(mockReq, mockRes);
      expect(authService.authenticateUser).toHaveBeenCalledWith(
        mockReq.body.email,
        mockReq.body.password
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(errorObject);
    });
  });
});
