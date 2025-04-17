const logRequest = (data) => {
  console.log(JSON.stringify(data, null, 2));
};

module.exports = { logRequest };