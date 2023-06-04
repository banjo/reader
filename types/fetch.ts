export type Result<T> =
    | {
          data: T;
          success: true;
      }
    | {
          error: string;
          success: false;
      };
