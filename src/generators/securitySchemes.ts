import { SecuritySchemeObject } from "openapi3-ts/oas31";

/**
 * Generates security schemes for the Knack API
 */
export function generateSecuritySchemes(): Record<
  string,
  SecuritySchemeObject
> {
  return {
    apiKey: {
      type: "apiKey",
      in: "header",
      name: "X-Knack-Application-Id",
      description:
        "API key for object-based operations. Required for all object-based endpoints.",
    },
    apiKeyRest: {
      type: "apiKey",
      in: "header",
      name: "X-Knack-REST-API-Key",
      description:
        "REST API key for authenticated operations. Required along with the Application ID.",
    },
    viewAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description:
        "Bearer token for view-based operations when accessing secure views. Format: 'Bearer {token}'",
    },
  };
}
