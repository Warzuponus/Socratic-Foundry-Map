// Rules for converting the Marble Skill Taxonomy's UK English to US English.
// Applied in this order: skip check, exact rewrites, phrase rules, school-year
// references, then word-level spelling (spelling.json). Every rule is meant to
// be safe to re-run: its output never matches its own input pattern.

// Texts that teach a UK-only spelling rule. They are left untouched and listed
// in review-needed.md, because a find-and-replace would make them wrong.
export const skipText = [
  /licence/i,
  /practi[cs]e\s*\/\s*practi[cs]e/i,
  /-ise\b/,
  /co-ordinate/i,
];

// Exact rewrites for UK coins and notes, which have no one-to-one US match.
export const exactRewrites = [
  ['Identify 1p, 2p, 5p, 10p, 20p, 50p, £1 and £2 coins', 'Identify pennies (1¢), nickels (5¢), dimes (10¢), quarters (25¢), and $1 coins'],
  ['like 2p, 5p, 20p', 'like a penny, a nickel, or a dime'],
  ['a £2 coin is worth more than a 50p coin', 'a dime is worth more than a nickel, even though it is smaller'],
  ['had a £2 coin', 'had a $1 bill'],
  ['Show that 50p can be made with 2×20p + 1×10p, or 5×10p, or 1×50p', 'Show that 50¢ can be made with 2 quarters, or 5 dimes, or 1 quarter + 2 dimes + 1 nickel'],
  ['pays with a £1 coin', 'pays with a $1 bill'],
  ['coins worth 50p, 20p, and 10p, can they write the total using the p symbol', 'three quarters and a dime, can they write the total using the ¢ symbol'],
  ['50p + 20p + 5p = 75p', '25¢ + 25¢ + 10¢ + 10¢ + 5¢ = 75¢'],
  ['Recognise £5 and £10 notes', 'Recognize $1, $5, and $10 bills'],
  ['symbols for pounds (£) and pence (p)', 'symbols for dollars ($) and cents (¢)'],
  ['an aluminium drinks can', 'an aluminum soda can'],
];

// Phrase rules: [pattern, replacement]. Patterns are global regexes.
export const phraseRules = [
  // Money
  [/Pounds & Pence/g, 'Dollars & Cents'],
  [/pounds and pence/g, 'dollars and cents'],
  [/£ and p\b/g, '$ and ¢'],
  [/Coins & Notes/g, 'Coins & Bills'],
  [/coins(,| and| or|\/) ?notes/g, (m, sep) => `coins${sep === '/' ? '/' : sep + ' '}bills`],
  [/money in pounds/g, 'money in dollars'],
  [/of a pound\b/g, 'of a dollar'],
  [/\bpence\b/g, 'cents'],
  [/£(\d[\d,]*(?:\.\d+)?)/g, '$$$1'],
  [/(?<![\w.£$])(\d+)p\b/g, '$1¢'],
  [/(\$\d+(?:\.\d+)?) notes?\b/g, '$1 bill'],
  [/\bper cent\b/g, 'percent'],
  [/\bpocket money or allowance\b/g, 'allowance'],
  [/\bPocket Money\b/g, 'an Allowance'],
  [/\bpocket money\b/g, 'allowance'],

  // Punctuation names
  [/inverted commas \(speech marks\)/g, 'quotation marks'],
  [/inverted commas\/speech marks/g, 'quotation marks'],
  [/inverted commas/g, 'quotation marks'],
  [/speech marks/g, 'quotation marks'],
  [/Full stops/g, 'Periods'],
  [/full stops/g, 'periods'],
  [/Full stop/g, 'Period'],
  [/full stop/g, 'period'],
  [/Brackets/g, 'Parentheses'],
  [/brackets/g, 'parentheses'],

  // Measurement and direction
  [/anti-clockwise/g, 'counterclockwise'],
  [/Metric & Imperial/g, 'Metric & Customary'],
  [/imperial units/g, 'customary units'],
  [/imperial\/metric/g, 'customary/metric'],
  [/imperial equivalences/g, 'customary equivalences'],

  // Everyday vocabulary
  [/football practice/g, 'soccer practice'],
  [/loves football/g, 'loves soccer'],
  [/chose football/g, 'chose soccer'],
  [/like football, like cricket/g, 'like soccer, like baseball'],
  [/rubbish at this/g, 'terrible at this'],
  [/go on holiday/g, 'go on vacation'],
  [/every pupil/g, 'every student'],
  [/\bpupils\b/g, 'students'],
  [/secondary school/g, 'middle and high school'],
  [/colour of sweet\b/g, 'color of candy'],
  [/shoplifting a sweet\b/g, 'shoplifting a candy bar'],
  [/\bsweets\b/g, 'candies'],
  [/statutory word list/g, 'word list'],
  [/statutory /g, ''],
];

// UK school years and key stages become US grades. UK Year N is US grade N-1,
// so Year 1 is kindergarten.
const g = (y) => (y - 1 === 0 ? 'K' : String(y - 1));
const single = (y) => (y - 1 === 0 ? 'kindergarten' : `grade ${y - 1}`);

export const yearRules = [
  [/\bYears? (\d) and (\d)\b/g, (m, a, b) => `grades ${g(+a)} and ${g(+b)}`],
  [/\bYears? (\d)\s*(?:-|–|to)\s*(\d)\b/g, (m, a, b) => `grades ${g(+a)}–${g(+b)}`],
  [/\bY(\d)\s*-\s*Y?(\d)\b/g, (m, a, b) => `grades ${g(+a)}–${g(+b)}`],
  [/\bYear (\d)\b/g, (m, a) => single(+a)],
  [/\bY(\d)\b/g, (m, a) => single(+a)],
  [/\bKS1\b|\bKey [Ss]tage 1\b/g, 'grades K–1'],
  [/\bKS2\b|\bKey [Ss]tage 2\b/g, 'grades 2–5'],
  [/\bKS3\b|\bKey [Ss]tage 3\b/g, 'grades 6–8'],
];

// Topics a person should rewrite, not a script. Matched against all of a
// topic's text; each hit is listed in review-needed.md with the reason.
// An optional third element limits the flag to one subject; an optional
// fourth is a pattern that, when present, cancels the flag.
export const reviewFlags = [
  [/licence|practi[cs]e\s*\/\s*practi[cs]e|-ise\b|co-ordinate/i, 'Teaches a UK-only spelling rule; rewrite for US spelling'],
  [/statutory|word list/i, 'Built on the English statutory spelling lists; swap in a US grade-level word list'],
  [/bus stop|short division/i, 'Short division ("bus stop") is a UK method; US grades teach long division with the standard algorithm'],
  [/24-hour/i, '24-hour clock is a UK requirement; US grades focus on a.m./p.m.'],
  [/Anglo-Saxon|Viking|Boudicca|Magna Carta|Norman|Tower of London|Roman Britain|Britain/i, 'English history focus; decide whether to keep, trim, or replace with US history'],
  [/\b(UK|England|London)\b/, 'UK example; consider a US example'],
  [/Celsius/i, 'Celsius only; US grades also use Fahrenheit', 'Science'],
  [/centimet|kilomet|millimet|\bmetres?\b|\bmeters?\b|litres?|liters?/i, 'Metric only; Common Core grades 2–5 also expect customary units (inches, feet, pounds, gallons)', 'Mathematics', /inch|feet|foot|pound|gallon|ounce|yard|mile|quart|pint|cup/i],
];
