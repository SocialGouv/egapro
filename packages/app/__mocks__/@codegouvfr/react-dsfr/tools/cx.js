function cx(...args) {
  return args.filter(Boolean).join(" ");
}

module.exports = {
  __esModule: true,
  cx,
  default: cx,
};

