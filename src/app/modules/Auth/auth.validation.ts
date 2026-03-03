import z from "zod";
const loginUser = z.object({
  body: z.object({
    email: z.email({
      message: "Invalid email format!",
    }),
    password: z.string({
      message: "Password is required!",
    }),
  }),
});

export const authValidation = { loginUser };
