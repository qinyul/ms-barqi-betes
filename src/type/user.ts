import { Document } from "mongoose";

interface User extends Document {
  username: string;
  email: string;
  password: string;
  accountNumber: string;
  identityNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export default User;
