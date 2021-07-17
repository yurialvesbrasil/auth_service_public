import lineReader from "line-reader";
import path from "path";
import config from "config";
export class ListaNegra {
  public static getListaIps(): string[] {
    const blacklist: string[] = [];
    lineReader.eachLine(
      path.join(
        __dirname,
        config.get("App.path_black_list.nivel1"),
        config.get("App.path_black_list.nivel2")
      ),
      /*eslint-disable @typescript-eslint/no-unused-vars*/
      function (line, _) {
        blacklist.push(line);
      }
    );

    return blacklist;
  }
}
