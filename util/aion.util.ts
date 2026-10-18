const REG_REPLACE: { regex: RegExp; replace: string }[] = [
  { regex: /\[charname:(?<charname>[^;\]]+)[^\]]*\]/g, replace: "$1" },
  { regex: /\[cmd:(?<charname>[^;\]]+)[^\]]*\]/g, replace: "<Recruit Group>" },
  { regex: /\[item: ?(?<itemId>[^;\]]+)[^\]]*\]/g, replace: "<https://aioncodex.com/usc/item/$1/>" },
];

export const parseAionMessage = (msg: string): string => {
  let ret = msg;
  REG_REPLACE.forEach((r) => {
    ret = ret.replaceAll(r.regex, r.replace);
  });
  ret = `[<t:${Math.floor(Date.now() / 1000)}:T>] ${ret}`;
  return ret;
};
