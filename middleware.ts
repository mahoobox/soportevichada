import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/api/webhook", "/sign-in", "/sign-up", "/api/test-email", "/api/test-smtp"],
  ignoredRoutes: ["/api/webhook", "/api/test-email", "/api/test-smtp"]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
