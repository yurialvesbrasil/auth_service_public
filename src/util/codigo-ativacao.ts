export class CodigoAtivacao {
  public static getRandomArbitrary(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
