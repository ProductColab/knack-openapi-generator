import { ComponentsObject, SchemaObject } from "openapi3-ts/oas31";
import { KnackObject, KnackSchema } from "../types/knackSchema";
import {
  mapFieldTypeToSchema,
  shouldIncludeField,
} from "../utils/fieldTypeMapper";

/**
 * Converts Knack objects to OpenAPI components
 */
export function generateComponents(schema: KnackSchema): ComponentsObject {
  const components: ComponentsObject = {
    schemas: {},
  };

  // Convert each object to a schema
  schema.application.objects.forEach((obj) => {
    const schemaObject = objectToSchema(obj);
    components.schemas![schemaObject.name] = schemaObject.schema;
  });

  return components;
}

/**
 * Converts a single Knack object to an OpenAPI schema
 */
export function objectToSchema(obj: KnackObject): {
  name: string;
  schema: SchemaObject;
} {
  // Create the base schema
  const schema: SchemaObject = {
    type: "object",
    title: obj.name,
    description: `${obj.inflections.singular} object`,
    properties: {},
    required: [],
  };

  // Add each field as a property
  obj.fields.forEach((field) => {
    // Skip fields that shouldn't be included
    if (!shouldIncludeField(field)) {
      return;
    }

    // Map the field type to an OpenAPI schema
    const fieldSchema = mapFieldTypeToSchema(field);

    // Add the property
    if (schema.properties) {
      schema.properties[field.key] = fieldSchema;
    }

    // Add required fields
    if (field.required && schema.required) {
      schema.required.push(field.key);
    }
  });

  // For empty required arrays, remove the property
  if (schema.required && schema.required.length === 0) {
    delete schema.required;
  }

  // Use the object.key as the schema name directly to match Knack's convention
  const name = obj.key;

  return { name, schema };
}
