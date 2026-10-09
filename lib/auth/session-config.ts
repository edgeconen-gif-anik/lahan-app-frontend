export const SESSION_IDLE_TIMEOUT_SECONDS = 60 * 60;
export const SESSION_IDLE_TIMEOUT_MS = SESSION_IDLE_TIMEOUT_SECONDS * 1000;

export const SESSION_ABSOLUTE_TIMEOUT_SECONDS = 6 * 60 * 60;
export const SESSION_ABSOLUTE_TIMEOUT_MS =
  SESSION_ABSOLUTE_TIMEOUT_SECONDS * 1000;

// How long before the idle timeout the "stay signed in?" prompt appears.
export const SESSION_IDLE_WARNING_MS = 2 * 60 * 1000;

// Short enough that the warning appears on time; the network heartbeat below
// is gated separately.
export const SESSION_IDLE_CHECK_INTERVAL_MS = 15 * 1000;
export const SESSION_HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
