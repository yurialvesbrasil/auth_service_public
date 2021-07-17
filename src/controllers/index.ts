import { Response } from "express";
import logger from "@src/logger";
import ApiError, { APIError } from "@src/util/errors/api-error";

export abstract class BaseController {
  /*protected sendCreateUpdateErrorResponse(res: Response, error: Error): void {
    logger.error(error);
    res
      .status(500)
      .send(ApiError.format({ code: 500, message: 'Erro interno do servidor.' }));
  }*/

  protected sendErrorResponse(res: Response, apiError: APIError): Response {
    return res.status(apiError.code).send(ApiError.format(apiError));
  }
}
