import { Request, Response, NextFunction } from "express";
import { Filter } from "bad-words";

const filter = new Filter();

// Extended Portuguese and English offensive words
const extraWords = [
  "idiota",
  "burro",
  "estupido",
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
  "shut up",
  "stupid",
  "idiot",
  "moron",
  "loser",
  "trash",
  "scum",
  "racist",
  "hate",
  "kill",
  "murder",
  "die",
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
];

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
  }
  next();
}
