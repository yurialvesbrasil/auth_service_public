import { Request, Response, NextFunction } from "express";
import AuthService from "@src/services/auth_service";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers?.["x-access-token"];
  try {
    if (!token) {
      res
        .status(400)
        .send({ code: 400, error: "Faltam parâmentros de segurança." });
    } else {
      const claims = AuthService.decodeToken(token as string);
      req.params.userId = claims.sub;
      next();
    }
  } catch (err) {
    res.status(401).send({ code: 401, error: err.message });
  }
}

//Verifica token enviado na autenticação do usuário
export function xTokenLoginMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers?.["x-token-login"];
  try {
    if (!token) {
      res
        .status(400)
        .send({ code: 400, error: "Faltam parâmentros de segurança." });
    } else {
      const claims = AuthService.decodeTokenAuthenticated(token as string);
      req.params.userId = claims.sub;
      next();
    }
  } catch (err) {
    res.status(401).send({ code: 401, error: err.message });
  }
}

//Verifica token enviado no cadastro do usuário
export function xTokenAtivacaoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers?.["x-token-ativacao"];
  try {
    if (!token) {
      res
        .status(400)
        .send({ code: 400, error: "Faltam parâmentros de segurança." });
    } else {
      const claims = AuthService.decodeTokenAtivacao(String(token));
      req.params.userId = claims.sub;
      next();
    }
  } catch (err) {
    res.status(401).send({ code: 401, error: err.message });
  }
}

//Verifica token enviado na solicitação de rest de senha
export function xTokenResetMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers?.["x-reset-token"];
  try {
    if (!token) {
      res
        .status(400)
        .send({ code: 400, error: "Faltam parâmentros de segurança." });
    } else {
      const claims = AuthService.decodeTokenResetPassword(token as string);
      req.params.userId = claims.sub;
      next();
    }
  } catch (err) {
    res.status(401).send({ code: 401, error: err.message });
  }
}

export function xTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers?.["x-token"];
  const email = req.headers?.["email"];
  try {
    if (!token || !email) {
      res
        .status(400)
        .send({ code: 400, error: "Faltam parâmentros de segurança." });
    } else if (!AuthService.validResquestEmail(String(token), String(email))) {
      res.status(401).send({ code: 401, error: "Unauthorized request." });
    } else {
      next();
    }
  } catch (err) {
    res.status(401).send({ code: 401, error: err.message });
  }
}
