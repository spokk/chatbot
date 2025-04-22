const log = (data, name = "Default log:") => {
  console.log(name, JSON.stringify(data, null, 2));
};

module.exports = { log };