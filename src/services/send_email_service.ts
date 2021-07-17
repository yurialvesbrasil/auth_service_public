import nodemailer, { Transporter } from "nodemailer";
import config from "config";
import handlebars from "handlebars";
import fs from "fs";
import logger from "@src/logger";
import { IServiceResponse } from "@src/util/payload/response";
import { ServiceInternalError } from "@src/util/errors/api-error";
export class SendEmailService {
  private client: Transporter;

  constructor() {
    const transporter = nodemailer.createTransport({
      host: `${config.get("App.email.email_host")}`,
      service: `${config.get("App.email.email_service")}`,
      port: config.get("App.email.email_porta"),
      secure: false,
      auth: {
        user: `${config.get("App.email.email_user")}`,
        pass: `${config.get("App.email.email_senha")}`,
      },
      debug: config.get("App.email.email_debug"),
      logger: config.get("App.email.email_logger"),
    });
    this.client = transporter;
  }

  async execute(
    to: string,
    subject: string,
    variables: Record<string, unknown>,
    path: string,
    filename?: string,
    filepath?: string
  ): Promise<IServiceResponse> {
    try {
      const templateFileContent = fs.readFileSync(path).toString("utf8");

      const mailTemplateParse = handlebars.compile(templateFileContent);

      const html = mailTemplateParse(variables);

      if (filename != null && filepath != null) {
        const message = await this.client.sendMail({
          to,
          subject,
          html,
          from: "prodepasurvey@yahoo.com",
          attachments: [
            {
              filename: filename,
              path: filepath,
            },
          ],
        });
        logger.info("Mensagem enviada1.");
        logger.info("Preview URL: %s", nodemailer.getTestMessageUrl(message));
      } else {
        const message = await this.client.sendMail({
          to,
          subject,
          html,
          from: "prodepasurvey@yahoo.com",
        });
        logger.info("Mensagem enviada2.");
        logger.info("Preview URL: %s", nodemailer.getTestMessageUrl(message));
      }
      return { code: 200, message: `Email enviado para: ${to} com sucesso!` };
    } catch (err) {
      logger.info(`Erro no envio de email: ${err}!`);
      throw new ServiceInternalError(`Erro no envio do email: ${err.message}`);
    }
  }
}
