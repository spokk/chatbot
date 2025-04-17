const logRequest = (req) => {
  console.log(JSON.stringify(req.body, null, 2));
};

module.exports = { logRequest };