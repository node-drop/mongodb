const MongoDbCredentials = {
  name: "mongoDb",
  displayName: "MongoDB Database",
  documentationUrl: "https://docs.mongodb.com/",
  icon: "🍃",
  color: "#13AA52",
  testable: true,
  properties: [
    {
      displayName: "Configuration Type",
      name: "configurationType",
      type: "options",
      options: [
        {
          name: "Connection String",
          value: "connectionString",
          description: "Use a MongoDB connection string",
        },
        {
          name: "Individual Parameters",
          value: "individual",
          description: "Configure connection parameters individually",
        },
      ],
      default: "individual",
      description: "How to configure the MongoDB connection",
    },
    {
      displayName: "Connection String",
      name: "connectionString",
      type: "text",
      displayOptions: {
        show: {
          configurationType: ["connectionString"],
        },
      },
      required: true,
      default: "",
      description: "MongoDB connection string (e.g., mongodb://localhost:27017/mydb or mongodb+srv://...)",
      placeholder: "mongodb://localhost:27017/mydb",
    },
    {
      displayName: "Host",
      name: "host",
      type: "text",
      displayOptions: {
        show: {
          configurationType: ["individual"],
        },
      },
      required: true,
      default: "localhost",
      description: "MongoDB server host (for Atlas: cluster0.xxxxx.mongodb.net)",
      placeholder: "localhost or cluster0.xxxxx.mongodb.net",
    },
    {
      displayName: "Port",
      name: "port",
      type: "number",
      displayOptions: {
        show: {
          configurationType: ["individual"],
        },
      },
      required: false,
      default: 27017,
      description: "MongoDB server port (not needed for Atlas)",
    },
    {
      displayName: "Database",
      name: "database",
      type: "text",
      displayOptions: {
        show: {
          configurationType: ["individual"],
        },
      },
      required: true,
      default: "",
      description: "Database name",
      placeholder: "my_database",
    },
    {
      displayName: "User",
      name: "user",
      type: "text",
      displayOptions: {
        show: {
          configurationType: ["individual"],
        },
      },
      required: false,
      default: "",
      description: "Database user (optional for local MongoDB)",
      placeholder: "username",
    },
    {
      displayName: "Password",
      name: "password",
      type: "password",
      typeOptions: {
        password: true,
      },
      displayOptions: {
        show: {
          configurationType: ["individual"],
        },
      },
      required: false,
      default: "",
      description: "Database password (optional for local MongoDB)",
    },
    {
      displayName: "SSL",
      name: "ssl",
      type: "boolean",
      displayOptions: {
        show: {
          configurationType: ["individual"],
        },
      },
      default: false,
      description: "Use SSL connection (automatically enabled for Atlas)",
    },
  ],

  /**
   * Test the MongoDB connection
   */
  async test(data) {
    let connectionString = "";

    // Build connection string based on configuration type
    if (data.configurationType === "connectionString") {
      if (!data.connectionString) {
        return {
          success: false,
          message: "Connection string is required",
        };
      }
      connectionString = data.connectionString;
    } else {
      // Individual parameters
      if (!data.host || !data.database) {
        return {
          success: false,
          message: "Host and database are required",
        };
      }

      const auth =
        data.user && data.password
          ? `${encodeURIComponent(data.user)}:${encodeURIComponent(
              data.password
            )}@`
          : "";

      // Detect if this is a MongoDB Atlas cluster (contains .mongodb.net)
      const isAtlas = data.host.includes(".mongodb.net");

      if (isAtlas) {
        // MongoDB Atlas requires SRV connection string and always uses SSL
        const authSource = "authSource=admin";
        const retryWrites = "retryWrites=true";
        const w = "w=majority";

        connectionString = `mongodb+srv://${auth}${data.host}/${data.database}?${authSource}&${retryWrites}&${w}`;
      } else {
        // Standard MongoDB connection
        const port = data.port || 27017;
        const sslParam = data.ssl ? "?ssl=true" : "";

        connectionString = `mongodb://${auth}${data.host}:${port}/${data.database}${sslParam}`;
      }
    }

    // Try to connect to MongoDB
    try {
      const { MongoClient } = require("mongodb");

      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 5000,
        maxPoolSize: 1, // Only create 1 connection for testing
      });

      try {
        // Test the connection
        await client.connect();
        
        // Get database info
        const admin = client.db().admin();
        const serverStatus = await admin.serverStatus();
        
        await client.close();

        const version = serverStatus.version;
        const host = serverStatus.host || "MongoDB Server";

        return {
          success: true,
          message: `Connected successfully to MongoDB ${version} at ${host}`,
        };
      } catch (connectionError) {
        await client.close();
        throw connectionError;
      }
    } catch (error) {
      // Handle specific MongoDB error codes and messages
      if (error.message.includes("ECONNREFUSED")) {
        return {
          success: false,
          message: `Cannot connect to MongoDB server. Connection refused. Please check if MongoDB is running.`,
        };
      } else if (error.message.includes("ENOTFOUND")) {
        return {
          success: false,
          message: `Cannot resolve host. Please check the hostname.`,
        };
      } else if (error.message.includes("ETIMEDOUT")) {
        return {
          success: false,
          message: `Connection timeout. Please check firewall and network settings.`,
        };
      } else if (error.message.includes("Authentication failed")) {
        return {
          success: false,
          message: "Authentication failed. Invalid username or password.",
        };
      } else if (error.message.includes("not authorized")) {
        return {
          success: false,
          message: "Authorization failed. User does not have access to this database.",
        };
      } else if (error.message.includes("MongoServerSelectionError")) {
        return {
          success: false,
          message: "Unable to connect to MongoDB server. Please check connection settings.",
        };
      } else if (error.message.includes("MongoParseError")) {
        return {
          success: false,
          message: "Invalid connection string format. Please check your connection string.",
        };
      } else {
        return {
          success: false,
          message: `Connection failed: ${error.message || "Unknown error"}`,
        };
      }
    }
  },
};

module.exports = MongoDbCredentials;