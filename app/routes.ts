import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("users", "routes/users.tsx"),
  route("user/:userId", "routes/user.$userId.tsx"),
  route("problems", "routes/problems.tsx"),
  
  // API routes
  route("api/ranking/:courseId", "routes/api.ranking.$courseId.ts"),
  
  // 404 catch-all
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;
