/** Shared viewport rules. Keep the mobile game presentation independent from OS. */
export const breakpoints = {
  gameHeaderMobileMax: 767,
} as const;

export const isMobileGameHeader = (width: number) => width <= breakpoints.gameHeaderMobileMax;
