// Company identification for PRODIUS ENTERPRISE S.R.L. (platform operator of Spacefly.ai).
// These are legal facts and are intentionally NOT translated.
export const COMPANY = {
  legalName: "PRODIUS ENTERPRISE S.R.L.",
  idno: "1024600066933",
  address:
    "str. Nicolae Testemițanu 16/3, ap. 80, MD-2006, Chișinău, Republic of Moldova",
  registeredDate: "21.08.2024",
  registrar: "Agenția Servicii Publice",
  email: "cristian@prodiusenterprise.com",
  phone: "+373 68200722",
} as const;

// Accepted payment methods shown in the footer (maib merchant requirement).
// TODO: replace text badges with official maib / Visa / Mastercard SVG assets.
export const PAYMENT_METHODS = ["maib", "VISA", "Mastercard"] as const;
