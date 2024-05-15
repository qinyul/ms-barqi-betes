import request from "supertest";
import express from "express";
import router from "./authRoutes";
import authController from "../controllers/authController";

const app = express();
app.use(express.json());
app.use(router);
jest.mock("../controllers/authController");

const mocked = jest.mocked;

describe("Auth Routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call register controller on POST /register", async () => {
    mocked(authController.register as any).mockImplementation(
      (req: any, res: any) => res.status(200).json({})
    );
    const res = await request(app).post("/register").send({
      username: "test",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
  });

  it("should call get user by PIN controller on GET /user/:id", async () => {
    mocked(authController.getUserByPin as any).mockImplementation(
      (req: any, res: any) => res.status(200).json({})
    );
    const res = await request(app).get("/user/1").send();

    expect(res.status).toBe(200);
  });

  it("should call update user by PIN controller on PATCH /user/:id", async () => {
    mocked(authController.updateUserById as any).mockImplementation(
      (req: any, res: any) => res.status(200).json({})
    );
    const res = await request(app).patch("/user/1").send();

    expect(res.status).toBe(200);
  });

  it("should call delete user by ID controller on DELETE /user/:id", async () => {
    mocked(authController.deleteUserById as any).mockImplementation(
      (req: any, res: any) => res.status(200).json({})
    );
    const res = await request(app).delete("/user/1").send();

    expect(res.status).toBe(200);
  });

  it("should call get users controller on get /user", async () => {
    mocked(authController.getUsers as any).mockImplementation(
      (req: any, res: any) => res.status(200).json({})
    );
    const res = await request(app).get("/user").send();

    expect(res.status).toBe(200);
  });

  it("should call login controller on post /login", async () => {
    mocked(authController.login as any).mockImplementation(
      (req: any, res: any) => res.status(200).json({})
    );
    const res = await request(app).post("/login").send();

    expect(res.status).toBe(200);
  });
});
