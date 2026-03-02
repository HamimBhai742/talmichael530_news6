import z from "zod";

export const registerUser = z.object({
  body: z.object({
    name: z.string({
      message: "Name is required!",
    }),
    email: z.email({
      message: "Invalid email format!",
    }),
    password: z
      .string({
        message: "Password is required!",
      })
      .min(8, {
        message: "Password must be at least 8 characters long!",
      }),
  }),
});

