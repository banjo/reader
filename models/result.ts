export type BasicResult<T> =
    | {
          data: T;
          success: true;
      }
    | {
          error: string;
          success: false;
      };

export type ErrorType = "NotFound" | "BadRequest" | "Unauthorized" | "Forbidden" | "InternalError";

export type Result<T> =
    | {
          success: true;
          data: T;
      }
    | {
          success: false;
          type: ErrorType;
          message: string;
      };

export const Result = {
    ok: <T>(data: T): Result<T> => ({
        success: true,
        data,
    }),
    error: <T>(type: ErrorType, message: string): Result<T> => ({
        success: false,
        type,
        message,
    }),
};
