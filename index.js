// Export the node definitions
module.exports = {
  nodes: {
    "mongodb": require("./nodes/mongodb.node.js"),
  },
  credentials: {
    "mongoDb": require("./credentials/mongoDb.credentials.js"),
  },
};