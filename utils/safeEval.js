const math = require("mathjs");

const safeEval = (formula, row) => {
  try {
    if (!formula) return undefined;

    const allowed = /^[0-9+\-*/().\s\w]+$/;
    if (!allowed.test(formula)) return undefined;

    const tokens = formula.match(/[a-zA-Z_]\w*/g) || [];

    let expr = formula;

    tokens.forEach(token => {
      const val = Number(row[token]);
      expr = expr.replace(
        new RegExp(`\\b${token}\\b`, "g"),
        isNaN(val) ? 0 : val
      );
    });

    return math.evaluate(expr); // ✅ SAFE

  } catch {
    return undefined;
  }
};

module.exports = safeEval;