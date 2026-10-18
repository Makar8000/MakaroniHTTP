import * as deepl from "deepl-node";

const tlOpts: deepl.TranslatorOptions = {
  sendPlatformInfo: false,
};

export const translator = new deepl.Translator(Bun.env.DEEPL_API_KEY ?? "", tlOpts);
