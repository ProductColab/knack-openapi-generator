#!/usr/bin/env node

import { OpenAPIObject } from "openapi3-ts/oas31";
import YAML from "yaml";
import fs from "fs";
import path from "path";
import { Command } from "commander";
import axios from "axios";
import { generateComponents } from "./generators/objectsToComponents";
import { generateViewComponents } from "./generators/viewsToComponents";
import { generateObjectPaths } from "./generators/objectsToPaths";
import { generateViewPaths } from "./generators/viewsToPaths";
import { generateSecuritySchemes } from "./generators/securitySchemes";
import { generatePaginationComponents } from "./generators/paginationToComponents";
import { KnackSchema } from "./types/knackSchema";

/**
 * Fetches the Knack schema from either a local file or a remote URL
 */
async function fetchSchema(schemaSource: string): Promise<KnackSchema> {
  try {
    // Check if source is a URL
    if (
      schemaSource.startsWith("http://") ||
      schemaSource.startsWith("https://")
    ) {
      console.log(`Fetching schema from remote URL: ${schemaSource}`);
      const response = await axios.get(schemaSource);
      return response.data;
    } else {
      // Treat as local file path
      const resolvedPath = path.resolve(process.cwd(), schemaSource);
      console.log(`Reading schema from local file: ${resolvedPath}`);
      const schemaData = await fs.promises.readFile(resolvedPath, "utf-8");
      return JSON.parse(schemaData);
    }
  } catch (error) {
    throw new Error(`Failed to fetch schema from ${schemaSource}: ${error}`);
  }
}

/**
 * Main function to generate OpenAPI spec from Knack schema
 */
async function generateOpenApi(
  schemaSource: string = "application_schema.json",
  outputDir: string = "output"
): Promise<void> {
  try {
    // Fetch the Knack application schema
    const knackSchema = await fetchSchema(schemaSource);

    // Create the base OpenAPI spec
    const openApiSpec: OpenAPIObject = {
      openapi: "3.1.0",
      info: {
        title: `${knackSchema.application.name} API`,
        description: `OpenAPI specification for ${knackSchema.application.name}`,
        version: "1.0.0",
      },
      servers: [
        {
          url: `https://${knackSchema.api_subdomain}.${knackSchema.api_domain}/v1`,
          description: "Knack API Server",
        },
      ],
      tags: [
        {
          name: "Objects",
          description: "Object-based API endpoints with full access to data",
        },
        ...knackSchema.application.scenes.map((scene) => ({
          name: `View: ${scene.name}`,
          description: `Endpoints for ${scene.name} views`,
        })),
      ],
      paths: {
        ...generateObjectPaths(knackSchema),
        ...generateViewPaths(knackSchema),
      },
      components: {
        schemas: {
          ...generateComponents(knackSchema).schemas,
          ...generateViewComponents(knackSchema).schemas,
          ...generatePaginationComponents().schemas,
        },
        parameters: {
          ...generatePaginationComponents().parameters,
        },
        securitySchemes: generateSecuritySchemes(),
      },
    };

    // Output the OpenAPI spec as JSON
    const outputPath = path.resolve(process.cwd(), outputDir);
    await fs.promises.mkdir(outputPath, { recursive: true });

    await fs.promises.writeFile(
      path.join(outputPath, "openapi.json"),
      JSON.stringify(openApiSpec, null, 2),
      "utf-8"
    );

    // Output the OpenAPI spec as YAML (more readable)
    await fs.promises.writeFile(
      path.join(outputPath, "openapi.yaml"),
      YAML.stringify(openApiSpec),
      "utf-8"
    );

    console.log("OpenAPI specification generated successfully!");
    console.log(`Output directory: ${outputPath}`);
  } catch (error) {
    console.error("Error generating OpenAPI spec:", error);
  }
}

// Set up CLI
const program = new Command();

program
  .name("knack-openapi")
  .description("Generate OpenAPI specification from Knack application schema")
  .version("1.0.0")
  .option(
    "-s, --schema <path>",
    "Path to Knack schema file or URL",
    "application_schema.json"
  )
  .option("-o, --output <directory>", "Output directory", "output")
  .action((options) => {
    generateOpenApi(options.schema, options.output).catch(console.error);
  });

program.parse(process.argv);
