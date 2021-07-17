import { UsuarioService } from "@src/services/usuario_service";

/*eslint-disable @typescript-eslint/interface-name-prefix*/
interface IUsuario {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  idEmpresa: string;
  foto?: string;
}

describe("CodigoService", () => {
  it("cria um novo usuário", async () => {
    const usuarioService = new UsuarioService();
    const usuario: IUsuario = {
      nome: "Yuri Brasil",
      telefone: "9984018574",
      email: "yuriprodepa@gmail.com",
      senha: "123456",
      idEmpresa: "26db26f7-665c-4fbc-8f7b-50613861882b",
    };

    const newUsuario = {
      code: 201,
      message: "Usuário criado com sucesso.",
      usuario: {
        nome: "Yuri Brasil",
        email: "yuriprodepa@gmail.com",
        telefone: "9984018574",
        idEmpresa: "26db26f7-665c-4fbc-8f7b-50613861882b",
      },
    };

    const response = await usuarioService.create(usuario);

    expect(response).toEqual(expect.objectContaining(newUsuario));
  });
});
