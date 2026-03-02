import { Router } from "express";
import { UserRouters } from "../modules/User/user.routes";
import { AuthRouters } from "../modules/Auth/auth.routes";

const router = Router();

const routes = [
  {
    path: "/user",
    route: UserRouters,
  },
  {
    path: "/auth",
    route: AuthRouters,
  }
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;