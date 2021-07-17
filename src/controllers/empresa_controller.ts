import { Controller, Get } from "@overnightjs/core";
import { BaseController } from ".";
import { Response, Request } from "express";
import { EmpresaService } from "@src/services/empresa_service";

@Controller("empresa")
export class EmpresasController extends BaseController {
  @Get("lista")
  public async list(_: Request, res: Response): Promise<Response> {
    try {
      const empresaService = new EmpresaService();
      const listaEmpresas = await empresaService.getListaEmpresas();
      if (!listaEmpresas)
        return this.sendErrorResponse(res, {
          message: "Nenhuma empresa encontrada",
          code: 404,
        });

      return res.status(200).send(listaEmpresas);
    } catch (err) {
      return this.sendErrorResponse(res, {
        message: `${err.message}`,
        code: 500,
      });
    }
  }
}
