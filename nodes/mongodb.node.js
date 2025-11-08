const { MongoClient, ObjectId } = require("mongodb");

/**
 * Helper function to build MongoDB connection string
 * Automatically detects MongoDB Atlas and uses appropriate protocol
 */
function buildConnectionString(credentials) {
  if (credentials.configurationType === "connectionString") {
    return credentials.connectionString;
  }

  const auth =
    credentials.user && credentials.password
      ? `${encodeURIComponent(credentials.user)}:${encodeURIComponent(
          credentials.password
        )}@`
      : "";

  // Detect if this is a MongoDB Atlas cluster (contains .mongodb.net)
  const isAtlas = credentials.host.includes(".mongodb.net");

  if (isAtlas) {
    // MongoDB Atlas requires SRV connection string and always uses SSL
    const authSource = "authSource=admin";
    const retryWrites = "retryWrites=true";
    const w = "w=majority";

    return `mongodb+srv://${auth}${credentials.host}/${credentials.database}?${authSource}&${retryWrites}&${w}`;
  } else {
    // Standard MongoDB connection
    const port = credentials.port || 27017;
    const sslParam = credentials.ssl ? "?ssl=true" : "";

    return `mongodb://${auth}${credentials.host}:${port}/${credentials.database}${sslParam}`;
  }
}

const MongoDBNode = {
  type: "mongodb",
  displayName: "MongoDB",
  name: "mongodb",
  group: ["database"],
  version: 1,
  description:
    "Execute MongoDB operations - Find, Insert, Update, Delete, and Aggregate",
  icon: "file:icon.svg",
  color: "#13AA52",
  defaults: {
    name: "MongoDB",
  },
  inputs: ["main"],
  outputs: ["main"],
  credentials: [
    {
      name: "mongoDb",
      required: true,
    },
  ],
  properties: [
    {
      displayName: "Authentication",
      name: "authentication",
      type: "credential",
      required: true,
      default: "",
      description: "Select MongoDB credentials to connect to the database",
      placeholder: "Select credentials...",
      allowedTypes: ["mongoDb"],
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      default: "find",
      required: true,
      options: [
        {
          name: "Find",
          value: "find",
          description: "Find documents in a collection",
        },
        {
          name: "Insert",
          value: "insert",
          description: "Insert documents into a collection",
        },
        {
          name: "Update",
          value: "update",
          description: "Update documents in a collection",
        },
        {
          name: "Delete",
          value: "delete",
          description: "Delete documents from a collection",
        },
        {
          name: "Aggregate",
          value: "aggregate",
          description: "Run an aggregation pipeline",
        },
      ],
      description: "The operation to perform on the database",
    },
    // Collection field - shown for all operations
    {
      displayName: "Collection",
      name: "collection",
      type: "autocomplete",
      typeOptions: {
        loadOptionsMethod: "getCollections",
      },
      default: "",
      required: true,
      description: "Select a collection from the database",
      placeholder: "Search and select collection...",
    },
    // Find operation fields
    {
      displayName: "Query",
      name: "query",
      type: "string",
      typeOptions: {
        rows: 3,
      },
      displayOptions: {
        show: {
          operation: ["find"],
        },
      },
      default: "{}",
      description: 'MongoDB query filter as JSON (e.g., {"status": "active"})',
      placeholder: '{"status": "active"}',
    },
    {
      displayName: "Projection",
      name: "projection",
      type: "string",
      displayOptions: {
        show: {
          operation: ["find"],
        },
      },
      default: "",
      description: 'Fields to include/exclude (e.g., {"name": 1, "email": 1})',
      placeholder: '{"name": 1, "email": 1}',
    },
    {
      displayName: "Return All",
      name: "returnAll",
      type: "boolean",
      displayOptions: {
        show: {
          operation: ["find"],
        },
      },
      default: true,
      description: "Return all documents or limit the number",
    },
    {
      displayName: "Limit",
      name: "limit",
      type: "number",
      displayOptions: {
        show: {
          operation: ["find"],
          returnAll: [false],
        },
      },
      default: 50,
      description: "Maximum number of documents to return",
    },
    {
      displayName: "Skip",
      name: "skip",
      type: "number",
      displayOptions: {
        show: {
          operation: ["find"],
        },
      },
      default: 0,
      description: "Number of documents to skip",
    },
    {
      displayName: "Sort",
      name: "sort",
      type: "string",
      displayOptions: {
        show: {
          operation: ["find"],
        },
      },
      default: "",
      description: 'Sort order as JSON (e.g., {"createdAt": -1, "name": 1})',
      placeholder: '{"createdAt": -1}',
    },
    // Insert operation fields
    {
      displayName: "Insert Mode",
      name: "insertMode",
      type: "options",
      displayOptions: {
        show: {
          operation: ["insert"],
        },
      },
      options: [
        {
          name: "Single Document",
          value: "single",
          description: "Insert a single document",
        },
        {
          name: "Multiple Documents",
          value: "multiple",
          description: "Insert multiple documents",
        },
      ],
      default: "single",
      description: "Insert one or multiple documents",
    },
    {
      displayName: "Document",
      name: "document",
      type: "string",
      typeOptions: {
        rows: 3,
      },
      displayOptions: {
        show: {
          operation: ["insert"],
          insertMode: ["single"],
        },
      },
      default: "{}",
      required: true,
      description: "Document to insert as JSON object",
      placeholder: '{"name": "John", "email": "john@example.com"}',
    },
    {
      displayName: "Documents",
      name: "documents",
      type: "string",
      typeOptions: {
        rows: 5,
      },
      displayOptions: {
        show: {
          operation: ["insert"],
          insertMode: ["multiple"],
        },
      },
      default: "[]",
      required: true,
      description: "Array of documents to insert",
      placeholder: '[{"name": "John"}, {"name": "Jane"}]',
    },
    // Update operation fields
    {
      displayName: "Update Mode",
      name: "updateMode",
      type: "options",
      displayOptions: {
        show: {
          operation: ["update"],
        },
      },
      options: [
        {
          name: "Update One",
          value: "updateOne",
          description: "Update the first matching document",
        },
        {
          name: "Update Many",
          value: "updateMany",
          description: "Update all matching documents",
        },
      ],
      default: "updateMany",
      description: "Update one or multiple documents",
    },
    {
      displayName: "Filter",
      name: "filter",
      type: "string",
      typeOptions: {
        rows: 3,
      },
      displayOptions: {
        show: {
          operation: ["update"],
        },
      },
      default: "{}",
      required: true,
      description: 'Filter to match documents (e.g., {"status": "pending"})',
      placeholder: '{"status": "pending"}',
    },
    {
      displayName: "Update",
      name: "update",
      type: "string",
      typeOptions: {
        rows: 3,
      },
      displayOptions: {
        show: {
          operation: ["update"],
        },
      },
      default: "{}",
      required: true,
      description: 'Update operations (e.g., {"$set": {"status": "active"}})',
      placeholder: '{"$set": {"status": "active"}}',
    },
    {
      displayName: "Upsert",
      name: "upsert",
      type: "boolean",
      displayOptions: {
        show: {
          operation: ["update"],
        },
      },
      default: false,
      description: "Insert a document if no match is found",
    },
    // Delete operation fields
    {
      displayName: "Delete Mode",
      name: "deleteMode",
      type: "options",
      displayOptions: {
        show: {
          operation: ["delete"],
        },
      },
      options: [
        {
          name: "Delete One",
          value: "deleteOne",
          description: "Delete the first matching document",
        },
        {
          name: "Delete Many",
          value: "deleteMany",
          description: "Delete all matching documents",
        },
      ],
      default: "deleteMany",
      description: "Delete one or multiple documents",
    },
    {
      displayName: "Filter",
      name: "deleteFilter",
      type: "string",
      typeOptions: {
        rows: 3,
      },
      displayOptions: {
        show: {
          operation: ["delete"],
        },
      },
      default: "{}",
      required: true,
      description:
        'Filter to match documents to delete (e.g., {"status": "archived"})',
      placeholder: '{"status": "archived"}',
    },
    // Aggregate operation fields
    {
      displayName: "Pipeline",
      name: "pipeline",
      type: "string",
      typeOptions: {
        rows: 5,
      },
      displayOptions: {
        show: {
          operation: ["aggregate"],
        },
      },
      default: "[]",
      required: true,
      description: "Aggregation pipeline as JSON array",
      placeholder:
        '[{"$match": {"status": "active"}}, {"$group": {"_id": "$category", "count": {"$sum": 1}}}]',
    },
  ],

  // Custom settings specific to MongoDB
  settings: {
    connectionTimeout: {
      displayName: "Connection Timeout (ms)",
      name: "connectionTimeout",
      type: "number",
      default: 5000,
      description: "Maximum time to wait for database connection",
    },
    readPreference: {
      displayName: "Read Preference",
      name: "readPreference",
      type: "options",
      options: [
        { name: "Primary", value: "primary" },
        { name: "Primary Preferred", value: "primaryPreferred" },
        { name: "Secondary", value: "secondary" },
        { name: "Secondary Preferred", value: "secondaryPreferred" },
        { name: "Nearest", value: "nearest" },
      ],
      default: "primary",
      description: "Read preference for queries",
    },
  },

  execute: async function (inputData) {
    const items = inputData.main?.[0] || [];
    const results = [];

    // If no input items, create a default item to ensure query executes at least once
    const itemsToProcess = items.length > 0 ? items : [{ json: {} }];

    // Get settings
    const continueOnFail = this.settings?.continueOnFail ?? false;

    this.logger.info(`[MongoDB] continueOnFail setting: ${continueOnFail}`);
    this.logger.info(`[MongoDB] Settings object:`, this.settings);

    // Get connection parameters from credentials
    let connectionString = "";

    try {
      const credentials = await this.getCredentials("mongoDb");

      if (!credentials) {
        throw new Error(
          "MongoDB credentials are required. Please select credentials in the Authentication field."
        );
      }

      // Build connection string using helper function
      connectionString = buildConnectionString(credentials);

      this.logger.info("Using MongoDB credentials", {
        host: credentials.host,
        database: credentials.database,
      });
    } catch (error) {
      throw new Error(`Failed to get credentials: ${error.message}`);
    }

    const operation = await this.getNodeParameter("operation");
    const collection = await this.getNodeParameter("collection");

    // Use settings for connection timeout
    const connectionTimeout = this.settings?.connectionTimeout ?? 5000;
    const readPreference = this.settings?.readPreference ?? "primary";

    this.logger.info("Using connection settings", {
      timeout: connectionTimeout,
      readPreference: readPreference,
    });

    // Create MongoDB client
    const client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: connectionTimeout,
      connectTimeoutMS: connectionTimeout,
      readPreference: readPreference,
    });

    try {
      // Connect to MongoDB
      await client.connect();
      const db = client.db();
      const coll = db.collection(collection);

      for (const item of itemsToProcess) {
        try {
          let result;

          switch (operation) {
            case "find": {
              const queryStr = await this.getNodeParameter("query");
              const projectionStr = await this.getNodeParameter("projection");
              const returnAll = await this.getNodeParameter("returnAll");
              const limit = returnAll
                ? 0
                : await this.getNodeParameter("limit");
              const skip = await this.getNodeParameter("skip");
              const sortStr = await this.getNodeParameter("sort");

              // Parse JSON strings
              let query = {};
              let projection = null;
              let sort = null;

              try {
                query = queryStr ? JSON.parse(queryStr) : {};
              } catch (e) {
                throw new Error(`Invalid query JSON: ${e.message}`);
              }

              if (projectionStr) {
                try {
                  projection = JSON.parse(projectionStr);
                } catch (e) {
                  throw new Error(`Invalid projection JSON: ${e.message}`);
                }
              }

              if (sortStr) {
                try {
                  sort = JSON.parse(sortStr);
                } catch (e) {
                  throw new Error(`Invalid sort JSON: ${e.message}`);
                }
              }

              // Build find query
              let cursor = coll.find(query);

              if (projection) {
                cursor = cursor.project(projection);
              }

              if (sort) {
                cursor = cursor.sort(sort);
              }

              if (skip > 0) {
                cursor = cursor.skip(skip);
              }

              if (limit > 0) {
                cursor = cursor.limit(limit);
              }

              const documents = await cursor.toArray();

              results.push({
                json: {
                  ...item.json,
                  documents: documents,
                  count: documents.length,
                },
              });
              break;
            }

            case "insert": {
              const insertMode = await this.getNodeParameter("insertMode");

              if (insertMode === "single") {
                const documentStr = await this.getNodeParameter("document");
                let document;

                try {
                  document =
                    typeof documentStr === "string"
                      ? JSON.parse(documentStr)
                      : documentStr;
                } catch (e) {
                  throw new Error(`Invalid document JSON: ${e.message}`);
                }

                result = await coll.insertOne(document);

                results.push({
                  json: {
                    ...item.json,
                    insertedId: result.insertedId.toString(),
                    acknowledged: result.acknowledged,
                  },
                });
              } else {
                const documentsStr = await this.getNodeParameter("documents");
                let documents;

                try {
                  documents =
                    typeof documentsStr === "string"
                      ? JSON.parse(documentsStr)
                      : documentsStr;
                } catch (e) {
                  throw new Error(`Invalid documents JSON: ${e.message}`);
                }

                if (!Array.isArray(documents)) {
                  throw new Error("Documents must be an array");
                }

                result = await coll.insertMany(documents);

                results.push({
                  json: {
                    ...item.json,
                    insertedIds: Object.values(result.insertedIds).map((id) =>
                      id.toString()
                    ),
                    insertedCount: result.insertedCount,
                    acknowledged: result.acknowledged,
                  },
                });
              }
              break;
            }

            case "update": {
              const updateMode = await this.getNodeParameter("updateMode");
              const filterStr = await this.getNodeParameter("filter");
              const updateStr = await this.getNodeParameter("update");
              const upsert = await this.getNodeParameter("upsert");

              let filter, update;

              try {
                filter =
                  typeof filterStr === "string"
                    ? JSON.parse(filterStr)
                    : filterStr;
              } catch (e) {
                throw new Error(`Invalid filter JSON: ${e.message}`);
              }

              try {
                update =
                  typeof updateStr === "string"
                    ? JSON.parse(updateStr)
                    : updateStr;
              } catch (e) {
                throw new Error(`Invalid update JSON: ${e.message}`);
              }

              const options = { upsert };

              if (updateMode === "updateOne") {
                result = await coll.updateOne(filter, update, options);
              } else {
                result = await coll.updateMany(filter, update, options);
              }

              results.push({
                json: {
                  ...item.json,
                  matchedCount: result.matchedCount,
                  modifiedCount: result.modifiedCount,
                  upsertedId: result.upsertedId?.toString(),
                  upsertedCount: result.upsertedCount || 0,
                  acknowledged: result.acknowledged,
                },
              });
              break;
            }

            case "delete": {
              const deleteMode = await this.getNodeParameter("deleteMode");
              const filterStr = await this.getNodeParameter("deleteFilter");

              let filter;

              try {
                filter =
                  typeof filterStr === "string"
                    ? JSON.parse(filterStr)
                    : filterStr;
              } catch (e) {
                throw new Error(`Invalid filter JSON: ${e.message}`);
              }

              if (deleteMode === "deleteOne") {
                result = await coll.deleteOne(filter);
              } else {
                result = await coll.deleteMany(filter);
              }

              results.push({
                json: {
                  ...item.json,
                  deletedCount: result.deletedCount,
                  acknowledged: result.acknowledged,
                },
              });
              break;
            }

            case "aggregate": {
              const pipelineStr = await this.getNodeParameter("pipeline");

              let pipeline;

              try {
                pipeline =
                  typeof pipelineStr === "string"
                    ? JSON.parse(pipelineStr)
                    : pipelineStr;
              } catch (e) {
                throw new Error(`Invalid pipeline JSON: ${e.message}`);
              }

              if (!Array.isArray(pipeline)) {
                throw new Error("Pipeline must be an array");
              }

              const documents = await coll.aggregate(pipeline).toArray();

              results.push({
                json: {
                  ...item.json,
                  documents: documents,
                  count: documents.length,
                },
              });
              break;
            }

            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
        } catch (error) {
          this.logger.error(`[MongoDB] Error in operation:`, error.message);

          if (continueOnFail) {
            results.push({
              json: {
                ...item.json,
                error: true,
                errorMessage: error.message,
                errorDetails: error.toString(),
              },
            });
          } else {
            throw error;
          }
        }
      }
    } finally {
      // Always close the connection
      await client.close();
    }

    this.logger.info(`[MongoDB] Returning results, count: ${results.length}`);
    this.logger.info(`[MongoDB] Results:`, JSON.stringify(results, null, 2));

    return [{ main: results }];
  },

  /**
   * Load options methods - dynamically load dropdown options
   */
  loadOptions: {
    /**
     * Get list of collections from the database
     */
    async getCollections() {
      let connectionString = "";

      try {
        const credentials = await this.getCredentials("mongoDb");

        if (!credentials) {
          return [
            {
              name: "No credentials selected",
              value: "",
              description: "Please select MongoDB credentials first",
            },
          ];
        }

        // Build connection string using helper function
        connectionString = buildConnectionString(credentials);
      } catch (error) {
        return [
          {
            name: "Error: Credentials required",
            value: "",
            description: error.message,
          },
        ];
      }

      // Create MongoDB client
      const connectionTimeout = this.settings?.connectionTimeout ?? 5000;
      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: connectionTimeout,
        connectTimeoutMS: connectionTimeout,
      });

      try {
        await client.connect();
        const db = client.db();

        // Get list of collections
        const collections = await db.listCollections().toArray();

        await client.close();

        // Format results for dropdown
        return collections.map((coll) => ({
          name: coll.name,
          value: coll.name,
          description: `Collection: ${coll.name}`,
        }));
      } catch (error) {
        await client.close();
        this.logger.error("Failed to load collections", { error });

        return [
          {
            name: "Error loading collections - check credentials",
            value: "",
            description: error.message,
          },
        ];
      }
    },
  },
};

module.exports = MongoDBNode;