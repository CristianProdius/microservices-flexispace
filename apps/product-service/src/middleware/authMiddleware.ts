// Re-export from shared auth-middleware package
export {
  shouldBeUser,
  shouldBeAdmin,
  shouldBeHost,
  shouldBeHostOrAdmin,
  resolveActingHost,
} from "@repo/auth-middleware/express";
