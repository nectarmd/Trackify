export type ActionResult = {
  ok?: boolean;
  error?: string;
  id?: string;
  /** Aviso de sucesso (ex.: "confirme o novo e-mail"). */
  message?: string;
};
