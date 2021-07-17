export class PortaConfig {
  public static normalizePort(val: string): number | string | undefined {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
      // named pipe
      return val;
    }
    if (port >= 0) {
      // port number
      return port;
    }
    return undefined;
  }
}
