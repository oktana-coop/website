export type SuccessResult<T = void> = { success: true; data?: T };
export type ErrorResult = { success: false; error: string };
