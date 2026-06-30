import { Request, Response, NextFunction } from "express";
import { Filter } from "bad-words";

const filter = new Filter();

// Palavrões e insultos em PT e EN
const extraWords = [
  // Português
  "idiota",
  "burro",
  "estupido",
  "estúpido",
  "cretino",
  "imbecil",
  "palhaço",
  "lixo",
  "merda",
  "porra",
  "caralho",
  "cona",
  "filho da puta",
  "puta",
  "puto",
  "vadia",
  "prostituta",
  "piranha",
  "cabrao",
  "cabrão",
  "besta",
  "animal",
  "retardado",
  "deficiente",
  "desgraçado",
  "maldito",
  "bastardo",
  "filho da mãe",
  "paneleiro",
  "maricas",
  "bicha",
  "preto de merda",
  "cigano de merda",
  "branco de merda",
  "gay de merda",
  "esquisito",
  "noob",
  "chulo",
  "patego",
  "paspalho",
  "otário",
  "otario",
  "parvo",
  "tolo",
  "bostas",
  "merdoso",
  "nojento",
  "estuprador",
  "pedófilo",
  "pedofilo",
  "violador",
  "assassino",
  "matar",
  "morrer",
  "morra",
  "fdp",
  "crl",
  "caralh0",
  "p0rra",
  "m3rda",
  "c0na",
  "put4",
  "vadi4",
  // Inglês
  "shut up",
  "stupid",
  "idiot",
  "moron",
  "loser",
  "trash",
  "scum",
  "racist",
  "nazi",
  "fascist",
  "hate",
  "kill",
  "murder",
  "die",
  "kys",
  "bitch",
  "bastard",
  "damn",
  "hell",
  "asshole",
  "dick",
  "pussy",
  "slut",
  "whore",
  "faggot",
  "nigger",
  "nigga",
  "retard",
  "cunt",
  "twat",
  "wanker",
  "bullshit",
  "fuck",
  "fucking",
  "fck",
  "fuk",
  "sh1t",
  "d1ck",
  "b1tch",
];

extraWords.forEach((word) => {
  try {
    filter.addWords(word);
  } catch {
    // no-op
  }
});

const CHECKED_FIELDS = [
  "content",
  "title",
  "description",
  "cover_letter",
  "coverLetter",
  "reason",
  "requirements",
  "name",
  "displayName",
  "bio",
];

// Deteta menções a outras plataformas sociais (nomes, URLs, handles)
const PLATFORM_MENTIONS = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "twitter",
  "x.com",
  "snapchat",
  "linkedin",
  "twitch",
  "discord",
  "telegram",
  "whatsapp",
  "onlyfans",
  "patreon",
  "paypal",
  "@gmail.com",
  "@hotmail.com",
  "@outlook.com",
  "@yahoo.com",
];

const PLATFORM_REGEX = new RegExp(
  PLATFORM_MENTIONS.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

// Deteta links em geral
const URL_REGEX =
  /https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.(com|pt|net|org|io|co|app|me|info|biz|es|fr|de|uk)[^\s]*/i;

export function moderateContent(req: Request, res: Response, next: NextFunction) {
  if (!req.body || typeof req.body !== "object") return next();

  for (const field of CHECKED_FIELDS) {
    const value = req.body[field];
    if (typeof value !== "string" || !value.trim()) continue;

    if (filter.isProfane(value)) {
      res.status(400).json({
        error:
          "O conteúdo contém linguagem ofensiva ou inapropriada. Por favor reveja o que escreveu.",
        field,
      });
      return;
    }

    if (PLATFORM_REGEX.test(value)) {
      res.status(400).json({
        error: "Não é permitido mencionar ou promover outras plataformas na SaResO.",
        field,
      });
      return;
    }

    if (URL_REGEX.test(value)) {
      res.status(400).json({
        error: "Links externos não são permitidos. Publica o teu conteúdo diretamente na SaResO.",
        field,
      });
      return;
    }
  }
  next();
}
