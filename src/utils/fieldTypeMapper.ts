import { SchemaObject } from "openapi3-ts/oas31";
import { KnackField } from "../types/knackSchema";

/**
 * Maps a Knack field type to an OpenAPI schema type
 */
export function mapFieldTypeToSchema(field: KnackField): SchemaObject {
  const baseSchema: SchemaObject = {
    title: field.name,
    description: `${field.name} field`,
  };

  if (field.required) {
    // Required is handled at the property level in OpenAPI
  }

  // Handle different field types
  switch (field.type) {
    case "short_text":
    case "name":
    case "email":
    case "password":
    case "paragraph_text":
    case "phone":
    case "address":
      return {
        ...baseSchema,
        type: "string",
        ...(field.type === "email" && { format: "email" }),
        ...(field.type === "paragraph_text" && { maxLength: 100000 }),
      };

    case "number":
      return {
        ...baseSchema,
        type: "number",
      };

    case "auto_increment":
      return {
        ...baseSchema,
        type: "integer",
        readOnly: true,
      };

    case "currency":
      return {
        ...baseSchema,
        type: "number",
        format: "float",
      };

    case "date_time":
      return {
        ...baseSchema,
        type: "string",
        format: "date-time",
      };

    case "multiple_choice":
      // Handle multiple choice fields
      if (field.format && field.format.options) {
        return {
          ...baseSchema,
          type: "string",
          enum: field.format.options,
          ...(field.format.default && { default: field.format.default }),
        };
      }
      return {
        ...baseSchema,
        type: "string",
      };

    case "boolean":
      return {
        ...baseSchema,
        type: "boolean",
      };

    case "connection":
      // For connections, we reference the connected object
      if (field.relationship) {
        return {
          ...baseSchema,
          type: "string",
          description: `Reference to a ${field.name} object`,
          format: "uuid", // Assuming the ID format is uuid
        };
      }
      return {
        ...baseSchema,
        type: "string",
      };

    case "file":
    case "image":
      return {
        ...baseSchema,
        type: "string",
        format: "uri",
        description: `URL to ${field.type}`,
      };

    case "signature":
      return {
        ...baseSchema,
        type: "string",
        format: "uri",
        description: "URL to signature image",
      };

    case "user_roles":
      return {
        ...baseSchema,
        type: "array",
        items: {
          type: "string",
        },
        description: "List of user roles",
      };

    case "equation":
      return {
        ...baseSchema,
        type: "number",
        readOnly: true,
        description: "Calculated field value",
      };

    case "timer":
      return {
        ...baseSchema,
        type: "number",
        description: "Timer value in seconds",
      };

    default:
      // Default to string for unknown types
      return {
        ...baseSchema,
        type: "string",
        description: `Unknown field type: ${field.type}`,
      };
  }
}

/**
 * Determines if a field should be included in the schema
 */
export function shouldIncludeField(field: KnackField): boolean {
  // Include all other fields
  return true;
}
