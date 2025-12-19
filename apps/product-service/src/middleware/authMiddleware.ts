// Re-export from shared auth-middleware package
export {
  shouldBeUser,
  shouldBeAdmin,
  shouldBeHost,
  shouldBeHostOrAdmin,
} from "@repo/auth-middleware/express";
