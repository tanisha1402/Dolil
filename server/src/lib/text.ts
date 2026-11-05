const BN = "০১২৩৪৫৬৭৮৯";
export const normalizeDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
