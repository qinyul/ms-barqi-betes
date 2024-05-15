import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Import jwt for mocking
import authService from "./authService";

jest.mock("../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const mocked = jest.mocked;

const mockedUser = {
  _id: "mockedUserId",
  email: "test@example.com",
  password: "hashedPassword",
};

const jwtSecret = "dummy-jwt-secret";

describe("authenticateUser Function", () => {
  const ENV = { ...process.env };

  afterEach(() => {
    process.env = ENV;
    jest.clearAllMocks();
  });

  beforeEach(() => {
    process.env.JWT_SECRET_KEY = jwtSecret;
  });

  it("should authenticate a user with correct credentials", async () => {
    const email = "mail@test.com";
    const password = "1234";

    mocked(User.findOne).mockResolvedValue(mockedUser);
    mocked(bcrypt.compare as any).mockResolvedValue(true);
    const mockToken = "mocked.token.string";
    mocked(jwt.sign as any).mockReturnValue(mockToken);

    const token = await authService.authenticateUser(email, password);
    expect(User.findOne).toHaveBeenCalledWith({ email });
    expect(bcrypt.compare).toHaveBeenCalledWith(password, "hashedPassword");
    expect(jwt.sign).toHaveBeenCalledWith({ email }, jwtSecret, {
      expiresIn: "1h",
    });
    expect(token).toBe(mockToken);
  });
});
