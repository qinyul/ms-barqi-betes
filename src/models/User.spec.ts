import { model } from "mongoose";
import User, { userSchema } from "../models/User";

jest.mock("mongoose");

const MockedUser = model("User");

describe("User Model", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new user model instance", () => {
    expect(model).toHaveBeenCalledWith("User", userSchema);
  });

  it("should export User model", () => {
    expect(User).toBe(MockedUser);
  });
});
