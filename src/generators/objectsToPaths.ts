import { PathsObject, OperationObject } from "openapi3-ts/oas31";
import { KnackObject, KnackSchema } from "../types/knackSchema";
import { createPaginatedResponseSchema } from "./paginationToComponents";

/**
 * Generates OpenAPI paths for all objects in the schema
 */
export function generateObjectPaths(schema: KnackSchema): PathsObject {
  const paths: PathsObject = {};

  // Generate paths for each object
  schema.application.objects.forEach((obj) => {
    const objectPaths = generatePathsForObject(obj);

    // Merge the object paths into the main paths object
    Object.assign(paths, objectPaths);
  });

  return paths;
}

/**
 * Generates all CRUD paths for a single object
 */
function generatePathsForObject(obj: KnackObject): PathsObject {
  const paths: PathsObject = {};
  const basePath = `/objects/${obj.key}`;
  const recordsPath = `${basePath}/records`;

  // GET /objects/{object_key} - Get object schema/metadata
  paths[basePath] = {
    get: generateObjectSchemaOperation(obj),
  };

  // Add all record operations to /records endpoints
  // GET /objects/{object_key}/records - List records
  paths[recordsPath] = {
    get: generateListRecordsOperation(obj),
  };

  // POST /objects/{object_key}/records - Create record
  paths[recordsPath] = {
    ...paths[recordsPath],
    post: generateCreateRecordOperation(obj),
  };

  // GET /objects/{object_key}/records/{id} - Get specific record
  paths[`${recordsPath}/{id}`] = {
    get: generateGetRecordOperation(obj),
  };

  // PUT /objects/{object_key}/records/{id} - Update record
  paths[`${recordsPath}/{id}`] = {
    ...paths[`${recordsPath}/{id}`],
    put: generateUpdateRecordOperation(obj),
  };

  // DELETE /objects/{object_key}/records/{id} - Delete record
  paths[`${recordsPath}/{id}`] = {
    ...paths[`${recordsPath}/{id}`],
    delete: generateDeleteRecordOperation(obj),
  };

  return paths;
}

/**
 * Generates the object schema operation for the base path
 */
function generateObjectSchemaOperation(obj: KnackObject): OperationObject {
  return {
    summary: `Get ${obj.inflections.singular} Structure`,
    description: `Retrieves the structure definition for ${obj.inflections.singular}`,
    operationId: `${obj.key}_getStructure${formatObjectNameForOperationId(
      obj.name
    )}`,
    tags: [obj.name, "Builder"],
    responses: {
      "200": {
        description: `The structure definition for ${obj.inflections.singular}`,
        content: {
          "application/json": {
            schema: {
              $ref: `#/components/schemas/${obj.key}`,
            },
          },
        },
      },
      "401": generateUnauthorizedResponse(),
    },
    security: [{ apiKey: [] }],
  };
}

/**
 * Generates the list operation for an object
 */
function generateListOperation(obj: KnackObject): OperationObject {
  return {
    summary: `List ${obj.inflections.plural}`,
    description: `Retrieves a list of ${obj.inflections.plural}`,
    operationId: `${obj.key}_list${formatObjectNameForOperationId(obj.name)}`,
    tags: [obj.name],
    parameters: [
      // Use refs to pagination parameters
      { $ref: "#/components/parameters/page" },
      { $ref: "#/components/parameters/rowsPerPage" },
      { $ref: "#/components/parameters/sortField" },
      { $ref: "#/components/parameters/sortOrder" },
      // Filtering parameters would go here, but they're complex and object-specific
      // We could add these in a future implementation
    ],
    responses: {
      "200": {
        description: `A list of ${obj.inflections.plural}`,
        content: {
          "application/json": {
            schema: createPaginatedResponseSchema(
              `#/components/schemas/${obj.key}`
            ),
          },
        },
      },
      "401": generateUnauthorizedResponse(),
    },
    security: [{ apiKey: [], apiKeyRest: [] }],
  };
}

/**
 * Generates the get operation for an object
 */
function generateGetOperation(obj: KnackObject): OperationObject {
  return {
    summary: `Get ${obj.inflections.singular}`,
    description: `Retrieves a specific ${obj.inflections.singular} by ID`,
    operationId: `${obj.key}_get${formatObjectNameForOperationId(obj.name)}`,
    tags: [obj.name],
    parameters: [
      {
        name: "id",
        in: "path",
        description: `ID of the ${obj.inflections.singular} to retrieve`,
        schema: {
          type: "string",
        },
        required: true,
      },
    ],
    responses: {
      "200": {
        description: `The requested ${obj.inflections.singular}`,
        content: {
          "application/json": {
            schema: {
              $ref: `#/components/schemas/${obj.key}`,
            },
          },
        },
      },
      "401": generateUnauthorizedResponse(),
      "404": {
        description: "Record not found",
      },
    },
    security: [{ apiKey: [], apiKeyRest: [] }],
  };
}

/**
 * Generates the create operation for an object
 */
function generateCreateOperation(obj: KnackObject): OperationObject {
  return {
    summary: `Create ${obj.inflections.singular}`,
    description: `Creates a new ${obj.inflections.singular}`,
    operationId: `${obj.key}_create${formatObjectNameForOperationId(obj.name)}`,
    tags: [obj.name],
    requestBody: {
      description: `${obj.inflections.singular} to create`,
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: `#/components/schemas/${obj.key}`,
          },
        },
      },
    },
    responses: {
      "201": {
        description: `The created ${obj.inflections.singular}`,
        content: {
          "application/json": {
            schema: {
              $ref: `#/components/schemas/${obj.key}`,
            },
          },
        },
      },
      "400": {
        description: "Invalid input",
      },
      "401": generateUnauthorizedResponse(),
    },
    security: [{ apiKey: [], apiKeyRest: [] }],
  };
}

/**
 * Generates the update operation for an object
 */
function generateUpdateOperation(obj: KnackObject): OperationObject {
  return {
    summary: `Update ${obj.inflections.singular}`,
    description: `Updates an existing ${obj.inflections.singular}`,
    operationId: `${obj.key}_update${formatObjectNameForOperationId(obj.name)}`,
    tags: [obj.name],
    parameters: [
      {
        name: "id",
        in: "path",
        description: `ID of the ${obj.inflections.singular} to update`,
        schema: {
          type: "string",
        },
        required: true,
      },
    ],
    requestBody: {
      description: `Updated ${obj.inflections.singular} data`,
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: `#/components/schemas/${obj.key}`,
          },
        },
      },
    },
    responses: {
      "200": {
        description: `The updated ${obj.inflections.singular}`,
        content: {
          "application/json": {
            schema: {
              $ref: `#/components/schemas/${obj.key}`,
            },
          },
        },
      },
      "400": {
        description: "Invalid input",
      },
      "401": generateUnauthorizedResponse(),
      "404": {
        description: "Record not found",
      },
    },
    security: [{ apiKey: [], apiKeyRest: [] }],
  };
}

/**
 * Generates the delete operation for an object
 */
function generateDeleteOperation(obj: KnackObject): OperationObject {
  return {
    summary: `Delete ${obj.inflections.singular}`,
    description: `Deletes a ${obj.inflections.singular}`,
    operationId: `${obj.key}_delete${formatObjectNameForOperationId(obj.name)}`,
    tags: [obj.name],
    parameters: [
      {
        name: "id",
        in: "path",
        description: `ID of the ${obj.inflections.singular} to delete`,
        schema: {
          type: "string",
        },
        required: true,
      },
    ],
    responses: {
      "204": {
        description: "Successfully deleted",
      },
      "401": generateUnauthorizedResponse(),
      "404": {
        description: "Record not found",
      },
    },
    security: [{ apiKey: [], apiKeyRest: [] }],
  };
}

/**
 * Generates a standard unauthorized response
 */
function generateUnauthorizedResponse(): any {
  return {
    description: "Unauthorized - Missing or invalid API key",
  };
}

/**
 * Formats an object name for use in operation IDs
 * Removes spaces and special characters
 */
function formatObjectNameForOperationId(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
    .replace(/\s+/g, ""); // Remove spaces
}

// Functions for /records endpoints with different operationIds
function generateListRecordsOperation(obj: KnackObject): OperationObject {
  const operation = generateListOperation(obj);
  operation.operationId = `${
    obj.key
  }_listRecords${formatObjectNameForOperationId(obj.name)}`;
  return operation;
}

function generateCreateRecordOperation(obj: KnackObject): OperationObject {
  const operation = generateCreateOperation(obj);
  operation.operationId = `${
    obj.key
  }_createRecord${formatObjectNameForOperationId(obj.name)}`;
  return operation;
}

function generateGetRecordOperation(obj: KnackObject): OperationObject {
  const operation = generateGetOperation(obj);
  operation.operationId = `${obj.key}_getRecord${formatObjectNameForOperationId(
    obj.name
  )}`;
  return operation;
}

function generateUpdateRecordOperation(obj: KnackObject): OperationObject {
  const operation = generateUpdateOperation(obj);
  operation.operationId = `${
    obj.key
  }_updateRecord${formatObjectNameForOperationId(obj.name)}`;
  return operation;
}

function generateDeleteRecordOperation(obj: KnackObject): OperationObject {
  const operation = generateDeleteOperation(obj);
  operation.operationId = `${
    obj.key
  }_deleteRecord${formatObjectNameForOperationId(obj.name)}`;
  return operation;
}
