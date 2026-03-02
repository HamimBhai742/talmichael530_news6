import { prisma } from "../lib/prisma";

export const connecteDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    await prisma.$disconnect();
    console.log("Database connected failed");
  }
};
