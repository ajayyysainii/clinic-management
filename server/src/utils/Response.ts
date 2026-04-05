import { Response as ExpressResponse } from 'express';

interface SuccessResponse<T = any> {
  data: T;
  message: string;
  statusCode: number;
  status: string;
}

interface ErrorResponse {
  message: string;
  statusCode: number;
  status: string;
}

class Response {
  static success<T = any>(
    res: ExpressResponse,
    data: T,
    statusCode: number,
    message: string,
    status: string = "Success"
  ): ExpressResponse<SuccessResponse<T>> {
    return res.status(statusCode).json({
      data: data,
      message: message,
      statusCode: statusCode,
      status: status,
    });
  }

  static error(
    res: ExpressResponse,
    statusCode: number,
    status: string = "Failure",
    message: string
  ): ExpressResponse<ErrorResponse> {
    return res.status(statusCode).json({
      message: message,
      statusCode: statusCode,
      status: status,
    });
  }
}

export default Response;
