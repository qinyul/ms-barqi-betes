import User from "../models/User";
import generateToken from "../utils/jwt-utils";
import bcrypt from "bcryptjs";

const authenticateUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  console.log("authenticateUser:: authenticating user");
  if (!user || !(await bcrypt.compare(password, user.password as string))) {
    throw new Error("Invalid Credentials");
  }

  return generateToken({ email });
};

export default { authenticateUser };
