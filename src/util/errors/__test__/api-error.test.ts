import ApiError from '../api-error';

describe('ApiError', () => {
  it('deve formatar o erro com mensagem enviada', () => {
    const error = ApiError.format({
      code: 404,
      message: 'Recurso não encontrado!',
    });
    expect(error).toEqual({
      message: 'Recurso não encontrado!',
      error: 'Not Found',
      code: 404,
    });
  });
});
