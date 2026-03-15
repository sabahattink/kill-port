const isColorSupported = process.env.NO_COLOR == null && process.env.TERM !== 'dumb';

const wrap = (code: number, resetCode: number) => (str: string) =>
  isColorSupported ? `\x1b[${code}m${str}\x1b[${resetCode}m` : str;

export const red = wrap(31, 39);
export const green = wrap(32, 39);
export const yellow = wrap(33, 39);
export const cyan = wrap(36, 39);
export const bold = wrap(1, 22);
export const dim = wrap(2, 22);
