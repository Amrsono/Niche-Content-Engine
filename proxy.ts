import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication (admin-only)
const isProtectedRoute = createRouteMatcher([
  "/",               // Homepage Dashboard
  "/history(.*)",
  "/analytics(.*)",
  "/diagnostic(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_SECRET_KEY);
  if (!hasClerkKeys && process.env.NODE_ENV === 'development') {
    return;
  }
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
