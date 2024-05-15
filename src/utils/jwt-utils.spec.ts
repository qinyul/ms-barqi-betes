import jwt from "jsonwebtoken";
import generateToken from "./jwt-utils";

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

describe("Generate Token Function", () => {
  const ENV = { ...process.env };
  const jwtSecret = "dummy-secret";

  beforeEach(() => {
    process.env.JWT_SECRET_KEY = jwtSecret;
  });
  afterEach(() => {
    process.env = ENV;
    jest.clearAllMocks();
  });

  it("should generate a valid JWT Token", () => {
    const mockPayload = { email: "test@mail.com" };
    const mockedToken = "mocked.token.string";
    (jwt.sign as jest.Mock).mockReturnValue(mockedToken);
    const token = generateToken(mockPayload);

    expect(jwt.sign).toHaveBeenCalledWith(mockPayload, jwtSecret, {
      expiresIn: "1h",
    });

    expect(token).toBe(mockedToken);
  });
});
