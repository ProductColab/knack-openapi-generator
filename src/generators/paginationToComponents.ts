import {
  ComponentsObject,
  ParameterObject,
  SchemaObject,
} from "openapi3-ts/oas31";

/**
 * Generates reusable pagination components for the Knack API
 * - Parameters for pagination queries
 * - Response schema for paginated results
 */
export function generatePaginationComponents(): ComponentsObject {
  const components: ComponentsObject = {
    parameters: {
      ...generatePaginationParameters(),
    },
    schemas: {
      ...generatePaginationResponseSchemas(),
    },
  };

  return components;
}

/**
 * Generates the pagination parameter objects for endpoint query parameters
 */
function generatePaginationParameters(): Record<string, ParameterObject> {
  return {
    page: {
      name: "page",
      in: "query",
      description: "Page number to retrieve",
      schema: {
        type: "integer",
        default: 1,
        minimum: 1,
      },
      required: false,
    },
    rowsPerPage: {
      name: "rows_per_page",
      in: "query",
      description: "Number of records per page",
      schema: {
        type: "integer",
        default: 25,
        minimum: 1,
        maximum: 1000,
      },
      required: false,
    },
    sortField: {
      name: "sort_field",
      in: "query",
      description: "Field to sort by",
      schema: {
        type: "string",
      },
      required: false,
    },
    sortOrder: {
      name: "sort_order",
      in: "query",
      description: "Sort direction",
      schema: {
        type: "string",
        enum: ["asc", "desc"],
        default: "asc",
      },
      required: false,
    },
  };
}

/**
 * Generates the pagination response schemas for endpoint responses
 */
function generatePaginationResponseSchemas(): Record<string, SchemaObject> {
  return {
    PaginationMeta: {
      type: "object",
      description: "Pagination metadata for list responses",
      properties: {
        total_pages: {
          type: "integer",
          description: "Total number of pages available",
        },
        total_records: {
          type: "integer",
          description: "Total number of records across all pages",
        },
        current_page: {
          type: "integer",
          description: "Current page number",
        },
      },
    },
    PaginatedResponse: {
      type: "object",
      description: "Standard response format for paginated results",
      properties: {
        records: {
          type: "array",
          description: "Array of records for the current page",
          items: {
            type: "object",
            description: "Record data (varies by endpoint)",
          },
        },
        total_pages: {
          type: "integer",
          description: "Total number of pages available",
        },
        total_records: {
          type: "integer",
          description: "Total number of records across all pages",
        },
        current_page: {
          type: "integer",
          description: "Current page number",
        },
      },
    },
  };
}

/**
 * Creates a paginated response schema that wraps the given item schema
 * @param itemSchemaRef Reference to the schema for individual items in the response
 * @returns A schema for a paginated response of the specified items
 */
export function createPaginatedResponseSchema(
  itemSchemaRef: string
): SchemaObject {
  return {
    type: "object",
    properties: {
      records: {
        type: "array",
        items: {
          $ref: itemSchemaRef,
        },
      },
      total_pages: {
        type: "integer",
      },
      total_records: {
        type: "integer",
      },
      current_page: {
        type: "integer",
      },
    },
  };
}
