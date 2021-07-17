import { resolve } from 'path';
import { SendEmailService } from '../send_email_service';
import config from 'config';

describe('SenEmailService', () => {
  jest.setTimeout(30000);

  it('deve enviar uma mensagem de email com um código', async () => {
    const npsPathAtivacao = resolve(
      __dirname,
      config.get('App.path_ativacao.nivel1'),
      config.get('App.path_ativacao.nivel2'),
      config.get('App.path_ativacao.nivel3'),
      config.get('App.path_ativacao.nivel4'),
      config.get('App.path_ativacao.nivel5')
    );

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();

    const data = mm + '/' + dd + '/' + yyyy;

    const variables = {
      codigo: '123456',
      title: 'Obrigado por se cadastrar.',
      subtitulo: 'Confirme seu e-mail para ter acesso total ao sistema.',
      empresaNome: 'PERFIL SERVICE',
      data: data,
    };

    const sendEmailService = new SendEmailService();
    const resposta = await sendEmailService.execute(
      'yurihotmail@hotmail.com',
      'Confirme o seu email.',
      variables,
      npsPathAtivacao
    );

    expect(resposta).toEqual({
      code: 200,
      message: 'Email enviado para: yurihotmail@hotmail.com com sucesso!',
    });
  });
});
