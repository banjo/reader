import { NextResponse } from "next/server";
import { ErrorStatus, ErrorType } from "../models/result";

const success = <T>(data: T) => {
    return NextResponse.json({ data, success: true });
};

const error = (message: string, type: ErrorType) => {
    return new Response(message, { status: ErrorStatus[type], statusText: type });
};

export const ResponseService = { success, error };
