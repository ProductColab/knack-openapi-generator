# Knack OpenAPI Generator

A command-line tool to generate OpenAPI 3.1 specifications from [Knack](https://knack.com) application schemas.

## Features

- Convert Knack application schema to OpenAPI 3.1 specification
- Generate both JSON and YAML outputs
- Support for Knack objects and views
- Support for various Knack field types
- Accept schemas from both local files and remote URLs
- Complete API documentation with examples and schema references

## Installation

### Local Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/knack-openapi.git
cd knack-openapi

# Install dependencies
bun install

# Build the project
bun run build

# Link the CLI for global use (optional)
bun link
```

### Usage

```bash
# Using the CLI directly
knack-openapi --schema path/to/schema.json --output ./output

# Using bun script
bun run generate -- --schema path/to/schema.json --output ./output

# Using from a remote URL
knack-openapi --schema https://example.com/schema.json --output ./output
```

### Options

| Option      | Alias | Description                      | Default                   |
| ----------- | ----- | -------------------------------- | ------------------------- |
| `--schema`  | `-s`  | Path to Knack schema file or URL | `application_schema.json` |
| `--output`  | `-o`  | Output directory                 | `output`                  |
| `--help`    | `-h`  | Display help information         |                           |
| `--version` | `-v`  | Display version information      |                           |

## Output

The generator produces two files in the specified output directory:

- `openapi.json` - OpenAPI specification in JSON format
- `openapi.yaml` - OpenAPI specification in YAML format (more readable)

## Generated API Documentation

The OpenAPI specification includes:

- **Object Endpoints**: Full CRUD operations for each Knack object
- **View Endpoints**: Read operations for each Knack view
- **Field Types**: All Knack field types are mapped to appropriate OpenAPI types
- **Pagination**: Standardized pagination parameters for list operations
- **Authentication**: Security schemes for API authentication

## Example

```bash
# Generate OpenAPI spec from a local file
knack-openapi --schema test-schema.json --output ./api-docs

# Generate OpenAPI spec from a remote URL
knack-openapi --schema https://api.knack.com/v1/applications/123456789 --output ./api-docs
```

## Test Schema

A sample test schema (`test-schema.json`) is included in the repository to help you get started. This schema represents a simple Project Management application with:

- Projects with properties like name, description, due date, budget, and status
- Tasks connected to projects
- Views for browsing projects and tasks

You can use this sample schema to test the generator:

```bash
bun run generate -- --schema test-schema.json --output ./sample-output
```

## Development

```bash
# Run in development mode
bun run dev

# Build the project
bun run build
```

## How It Works

The generator:

1. Fetches the Knack schema from a local file or remote URL
2. Analyzes the schema structure, objects, fields, and views
3. Maps Knack field types to OpenAPI data types
4. Generates paths for all object CRUD operations and view operations
5. Creates component schemas for objects and views
6. Outputs the complete specification in both JSON and YAML formats

## License

MIT
