import { ComponentsObject, SchemaObject } from "openapi3-ts/oas31";
import {
  KnackSchema,
  KnackView,
  KnackScene,
  KnackObject,
  KnackField,
} from "../types/knackSchema";
import {
  mapFieldTypeToSchema,
  shouldIncludeField,
} from "../utils/fieldTypeMapper";

/**
 * Generates schema components for all views in the application
 */
export function generateViewComponents(schema: KnackSchema): ComponentsObject {
  const components: ComponentsObject = {
    schemas: {},
  };

  // Process each scene
  schema.application.scenes.forEach((scene) => {
    // Process each view in the scene
    scene.views.forEach((view) => {
      // Skip views that don't have a source object (like rich text, etc.)
      if (!view.source?.object) {
        return;
      }

      // Generate a schema for this specific view
      const viewSchema = generateViewSchema(view, scene, schema);

      // Only add if we successfully generated a schema
      if (viewSchema) {
        const schemaName = `view_${scene.slug}_${view.key}`;
        if (components.schemas) {
          components.schemas[schemaName] = viewSchema;
        }
      }
    });
  });

  return components;
}

/**
 * Generates a schema for a specific view
 */
function generateViewSchema(
  view: KnackView,
  scene: KnackScene,
  schema: KnackSchema
): SchemaObject | null {
  // Find the source object
  const sourceObject = schema.application.objects.find(
    (obj) => obj.key === view.source?.object
  );

  if (!sourceObject) {
    return null;
  }

  // Get field keys included in this view
  const fieldKeys = extractFieldKeysFromView(view);

  // If no field keys found, return null
  if (fieldKeys.length === 0) {
    return null;
  }

  // Create the schema
  const viewSchema: SchemaObject = {
    type: "object",
    title: `${view.name} in ${scene.name}`,
    description: `Schema for ${view.name} view in ${scene.name}`,
    properties: {},
    required: [],
  };

  // Add properties for each field in the view
  fieldKeys.forEach((fieldKey) => {
    const field = findFieldByKey(fieldKey, sourceObject, schema);
    if (field && shouldIncludeField(field)) {
      // Map the field to a schema property
      const fieldSchema = mapFieldTypeToSchema(field);

      // Add the property to the schema
      if (viewSchema.properties) {
        viewSchema.properties[field.key] = fieldSchema;
      }

      // If required, add to required array
      if (field.required && viewSchema.required) {
        viewSchema.required.push(field.key);
      }
    }
  });

  // If no properties were added, return null
  if (Object.keys(viewSchema.properties || {}).length === 0) {
    return null;
  }

  // If no required fields, remove the required array
  if (viewSchema.required && viewSchema.required.length === 0) {
    delete viewSchema.required;
  }

  return viewSchema;
}

/**
 * Extracts field keys from a view definition
 */
function extractFieldKeysFromView(view: KnackView): string[] {
  const fieldKeys: Set<string> = new Set();

  // Handle different view types
  switch (view.type) {
    case "table":
      // Extract fields from table columns
      if (view.columns) {
        view.columns.forEach((column) => {
          if (column.type === "field" && column.field?.key) {
            fieldKeys.add(column.field.key);
          }
        });
      }
      break;

    case "form":
      // Extract fields from form inputs
      if (view.groups) {
        view.groups.forEach((group) => {
          group.columns?.forEach((column) => {
            column.inputs?.forEach((input) => {
              // Handle input with direct key property
              if (input.key) {
                fieldKeys.add(input.key);
              }
              // Handle input with field.key structure
              else if (input.field && input.field.key) {
                fieldKeys.add(input.field.key);
              }
            });
          });
        });
      }
      break;

    case "details":
      // Extract fields from details view
      if (view.groups) {
        view.groups.forEach((group) => {
          group.columns?.forEach((column) => {
            column.fields?.forEach((field) => {
              if (field.key) {
                fieldKeys.add(field.key);
              }
            });
          });
        });
      }

      // Handle alternative details view structure
      if (view.columns) {
        view.columns.forEach((column) => {
          if (column.groups) {
            column.groups.forEach((group) => {
              if (group.columns) {
                group.columns.forEach((columnData) => {
                  // Handle both single fields and arrays of fields
                  if (Array.isArray(columnData)) {
                    columnData.forEach((field) => {
                      if (field && field.key) {
                        fieldKeys.add(field.key);
                      }
                    });
                  } else if (columnData && columnData.key) {
                    fieldKeys.add(columnData.key);
                  }
                });
              }
            });
          }
        });
      }
      break;

    case "search":
      // Extract fields from search results
      if (view.results?.columns) {
        view.results.columns.forEach((column) => {
          if (column.type === "field" && column.field?.key) {
            fieldKeys.add(column.field.key);
          }
        });
      }

      // Also add search filter fields
      if (view.groups) {
        view.groups.forEach((group) => {
          group.columns?.forEach((column) => {
            column.fields?.forEach((field) => {
              if (field.field && field.field !== "keyword_search") {
                fieldKeys.add(field.field);
              }
            });
          });
        });
      }
      break;
  }

  return Array.from(fieldKeys);
}

/**
 * Finds a field by its key, looking in the primary object and connected objects
 */
function findFieldByKey(
  fieldKey: string,
  sourceObject: KnackObject,
  schema: KnackSchema
): KnackField | null {
  // Check if the field is in the source object
  const directField = sourceObject.fields.find(
    (field) => field.key === fieldKey
  );
  if (directField) {
    return directField;
  }

  // If not found, check if it's a connection field
  const connectionField = sourceObject.fields.find(
    (field) => field.type === "connection" && field.relationship?.object
  );

  if (connectionField && connectionField.relationship?.object) {
    // Find the connected object
    const connectedObject = schema.application.objects.find(
      (obj) => obj.key === connectionField.relationship?.object
    );

    if (connectedObject) {
      // Look for the field in the connected object
      const connectedField = connectedObject.fields.find(
        (field) => field.key === fieldKey
      );
      if (connectedField) {
        return connectedField;
      }
    }
  }

  return null;
}
