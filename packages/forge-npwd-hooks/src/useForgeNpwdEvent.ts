export const useForgeNpwdEvent = <T = unknown>(event: string, outerPayload: T = {} as T) => {
  return function dispatch(innerPayload: T = {} as T) {
    const payload = Object.assign(outerPayload, innerPayload);

    window.dispatchEvent(
      new CustomEvent(event, {
        detail: payload,
      }),
    );
  };
};
