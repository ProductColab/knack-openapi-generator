import {
  PathsObject,
  OperationObject,
  ParameterObject,
} from "openapi3-ts/oas31";
import { KnackSchema, KnackView, KnackScene } from "../types/knackSchema";
import {
  ViewSecurity,
  determineViewSecurity,
} from "../utils/viewSecurityAnalyzer";
import { isViewInChildPage, getParentParamSlug } from "../utils/pageHelpers";
import { createPaginatedResponseSchema } from "./paginationToComponents";

/**
 * Generates OpenAPI paths for views
 */
export function generateViewPaths(schema: KnackSchema): PathsObject {
  const paths: PathsObject = {};

  // Process each scene
  schema.application.scenes.forEach((scene) => {
    // Process each view in the scene
    scene.views.forEach((view) => {
      // Skip views that don't have a source object (like rich text, etc.)
      if (!view.source?.object) {
        return;
      }

      const viewPaths = generatePathsForView(view, scene, schema);

      // Merge the view paths into the main paths object
      Object.assign(paths, viewPaths);
    });
  });

  return paths;
}

/**
 * Generates API paths for a single view
 */
function generatePathsForView(
  view: KnackView,
  scene: KnackScene,
  schema: KnackSchema
): PathsObject {
  const paths: PathsObject = {};

  // Skip views without an object source
  if (!view.source?.object) {
    return paths;
  }

  // Check if this view is in a child page
  const isChildPageView = isViewInChildPage(view, scene);
  const parentParamSlug = isChildPageView
    ? getParentParamSlug(scene, schema)
    : null;

  // Determine the base path - using scene key instead of slug
  const basePath = `/scenes/${scene.key}/views/${view.key}`;
  const recordsPath = `${basePath}/records`;

  const security = determineViewSecurity(view, scene, schema);
  const viewSchemaRef = `#/components/schemas/view_${scene.slug}_${view.key}`;

  // Form views only have POST/PUT endpoints (not GET)
  if (view.type === "form") {
    // Use type assertion for the action property since it may not be in the type definition
    const isUpdateForm = (view as any).action === "update";

    if (isUpdateForm) {
      // For update forms, use PUT
      paths[recordsPath] = {
        put: generateViewPutOperation(
          view,
          scene,
          schema,
          security,
          viewSchemaRef,
          isChildPageView,
          parentParamSlug
        ),
      };
    } else {
      // For create forms, use POST
      paths[recordsPath] = {
        post: generateViewPostOperation(
          view,
          scene,
          schema,
          security,
          viewSchemaRef,
          isChildPageView,
          parentParamSlug
        ),
      };
    }
  } else {
    // All other view types get a GET endpoint
    paths[recordsPath] = {
      get: generateViewGetOperation(
        view,
        scene,
        schema,
        security,
        viewSchemaRef,
        isChildPageView,
        parentParamSlug
      ),
    };
  }

  return paths;
}

/**
 * Creates a parent ID parameter object as a query parameter
 */
function createParentIdParameter(
  parentParamSlug: string,
  sceneName: string
): ParameterObject {
  return {
    name: parentParamSlug,
    in: "query" as const,
    description: `ID of the parent record for this ${sceneName} view`,
    schema: {
      type: "string" as const,
    },
    required: true,
  };
}

/**
 * Generates a GET operation for views
 */
function generateViewGetOperation(
  view: KnackView,
  scene: KnackScene,
  schema: KnackSchema,
  security: ViewSecurity,
  viewSchemaRef: string,
  isChildPageView: boolean,
  parentParamSlug: string | null
): OperationObject {
  // Check if this is a details view type which always returns a single record
  const isDetailsView = view.type === "details";

  // Find the source object to use for tagging
  const sourceObjectKey = view.source?.object;
  const sourceObject = schema.application.objects.find(
    (obj) => obj.key === sourceObjectKey
  );
  const tagName = sourceObject ? sourceObject.name : `View: ${scene.name}`;

  const operation: OperationObject = {
    summary: `Access ${view.name} records`,
    description: `Retrieves records from ${view.name} view in ${scene.name}. ${
      isDetailsView
        ? "Returns a single record."
        : isChildPageView
        ? "Returns a list of records filtered by the parent ID."
        : "Returns a list of records."
    }`,
    operationId: `${view.key}_access${formatNameForOperationId(view.name)}`,
    tags: [tagName],
    parameters: [
      // Add parent ID parameter if it's a child page (including details views)
      ...(isChildPageView && parentParamSlug
        ? [createParentIdParameter(parentParamSlug, scene.name)]
        : []),

      // Add pagination parameters for all list views (not details views)
      ...(!isDetailsView
        ? [
            { $ref: "#/components/parameters/page" },
            { $ref: "#/components/parameters/rowsPerPage" },
          ]
        : []),
    ],
    responses: {
      "200": {
        description: `Records from ${view.name}`,
        content: {
          "application/json": {
            schema: isDetailsView
              ? {
                  // Details views always return a single record
                  $ref: viewSchemaRef,
                }
              : // All other views return lists
                createPaginatedResponseSchema(viewSchemaRef),
          },
        },
      },
    },
    // All views require the application ID
    security: [{ apiKey: [] }],
  };

  // Add authentication requirements if needed
  if (security === ViewSecurity.AUTHENTICATED) {
    if (!operation.responses) {
      operation.responses = {};
    }
    operation.responses["401"] = {
      description: "Unauthorized - Authentication required",
    };
    // Replace the security with both application ID and bearer token for authenticated views
    operation.security = [{ apiKey: [], viewAuth: [] }];
  }

  return operation;
}

/**
 * Generates a POST operation for form views (create action)
 */
function generateViewPostOperation(
  view: KnackView,
  scene: KnackScene,
  schema: KnackSchema,
  security: ViewSecurity,
  viewSchemaRef: string,
  isChildPageView: boolean,
  parentParamSlug: string | null
): OperationObject {
  // Find the source object to use for tagging
  const sourceObjectKey = view.source?.object;
  const sourceObject = schema.application.objects.find(
    (obj) => obj.key === sourceObjectKey
  );
  const tagName = sourceObject ? sourceObject.name : `View: ${scene.name}`;

  const operation: OperationObject = {
    summary: `Submit ${view.name}`,
    description: `Submits data to ${view.name} form in ${scene.name}`,
    operationId: `${view.key}_submit${formatNameForOperationId(view.name)}`,
    tags: [tagName],
    parameters: [
      // Add parent ID parameter if it's a child page
      ...(isChildPageView && parentParamSlug
        ? [createParentIdParameter(parentParamSlug, scene.name)]
        : []),
    ],
    requestBody: {
      description: `Data to submit to ${view.name}`,
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: viewSchemaRef,
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Successfully submitted",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "ID of the created record",
                },
              },
            },
          },
        },
      },
      "400": {
        description: "Invalid input",
      },
    },
    // All views require the application ID
    security: [{ apiKey: [] }],
  };

  // Add authentication requirements if needed
  if (security === ViewSecurity.AUTHENTICATED) {
    if (!operation.responses) {
      operation.responses = {};
    }
    operation.responses["401"] = {
      description: "Unauthorized - Authentication required",
    };
    // Replace the security with both application ID and bearer token for authenticated views
    operation.security = [{ apiKey: [], viewAuth: [] }];
  }

  return operation;
}

/**
 * Generates a PUT operation for form views with update action
 */
function generateViewPutOperation(
  view: KnackView,
  scene: KnackScene,
  schema: KnackSchema,
  security: ViewSecurity,
  viewSchemaRef: string,
  isChildPageView: boolean,
  parentParamSlug: string | null
): OperationObject {
  // Find the source object to use for tagging
  const sourceObjectKey = view.source?.object;
  const sourceObject = schema.application.objects.find(
    (obj) => obj.key === sourceObjectKey
  );
  const tagName = sourceObject ? sourceObject.name : `View: ${scene.name}`;

  const operation: OperationObject = {
    summary: `Update ${view.name}`,
    description: `Updates data through ${view.name} form in ${scene.name}`,
    operationId: `${view.key}_update${formatNameForOperationId(view.name)}`,
    tags: [tagName],
    parameters: [
      // Add parent ID parameter if it's a child page
      ...(isChildPageView && parentParamSlug
        ? [createParentIdParameter(parentParamSlug, scene.name)]
        : []),
    ],
    requestBody: {
      description: `Data to update in ${view.name}`,
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: viewSchemaRef,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Successfully updated",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "ID of the updated record",
                },
              },
            },
          },
        },
      },
      "400": {
        description: "Invalid input",
      },
    },
    // All views require the application ID
    security: [{ apiKey: [] }],
  };

  // Add authentication requirements if needed
  if (security === ViewSecurity.AUTHENTICATED) {
    if (!operation.responses) {
      operation.responses = {};
    }
    operation.responses["401"] = {
      description: "Unauthorized - Authentication required",
    };
    // Replace the security with both application ID and bearer token for authenticated views
    operation.security = [{ apiKey: [], viewAuth: [] }];
  }

  return operation;
}

/**
 * Formats a name for use in operation IDs
 */
function formatNameForOperationId(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
    .replace(/\s+/g, ""); // Remove spaces
}
