import type * as deepl from "deepl-node";

export interface TranslateBody {
  text?: string | string[];
  sourceLang?: deepl.SourceLanguageCode | null;
  targetLang?: deepl.TargetLanguageCode;
}
