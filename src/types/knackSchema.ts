/**
 * TypeScript definitions for Knack application schema
 */

export interface KnackSchema {
  application: KnackApplication;
  // Other top-level properties
  base?: string;
  dir?: string;
  region?: string;
  s3?: any;
  s3_secure?: any;
  api_domain?: string;
  api_subdomain?: string;
  assets?: string;
}

export interface KnackApplication {
  name: string;
  description: string;
  id: string;
  slug: string;
  home_scene: { key: string; slug: string };
  objects: KnackObject[];
  scenes: KnackScene[];
  // Other properties
  distributions?: any[];
  counts?: Record<string, number>;
}

export interface KnackObject {
  _id: string;
  key: string;
  name: string;
  uuid: string;
  type: "StandardObject" | "UserObject";
  identifier: string;
  fields: KnackField[];
  inflections: {
    singular: string;
    plural: string;
  };
  connections: {
    inbound: KnackConnection[];
    outbound: KnackConnection[];
  };
  user?: boolean;
  status?: string;
  tasks?: any[];
  schemaChangeInProgress?: boolean;
  sort?: { field: string; order: "asc" | "desc" };
  profile_key?: string;
}

export interface KnackField {
  _id: string;
  key: string;
  name: string;
  type: KnackFieldType;
  required: boolean;
  unique: boolean;
  user?: boolean;
  conditional?: boolean;
  rules?: any[];
  validation?: any[];
  isSystemField?: boolean;
  format?: any;
  immutable?: boolean;
  relationship?: {
    has: "one" | "many";
    object: string;
    belongs_to: "one" | "many";
  };
}

export interface KnackConnection {
  has: "one" | "many";
  key: string;
  name: string;
  field: {
    name: string;
    inflections: {
      singular: string;
      plural: string;
    };
  };
  object: string;
  belongs_to: "one" | "many";
}

export type KnackFieldType =
  | "short_text"
  | "name"
  | "email"
  | "password"
  | "auto_increment"
  | "paragraph_text"
  | "number"
  | "currency"
  | "date_time"
  | "multiple_choice"
  | "connection"
  | "address"
  | "user_roles"
  | "file"
  | "image"
  | "boolean"
  | "phone"
  | "signature"
  | "equation"
  | "timer";

export interface KnackScene {
  _id: string;
  key: string;
  name: string;
  slug: string;
  uuid: string;
  views: KnackView[];
  groups: {
    columns: {
      keys: string[];
      width: number;
    }[];
  }[];

  // Authentication & security properties
  parent?: string; // Reference to parent scene by slug
  type?: string; // Can be "authentication" for login scenes
  allowed_profiles?: string[]; // Profiles allowed to access this scene
  limit_profile_access?: boolean; // Whether to limit access to specific profiles
  authenticated?: boolean; // Whether the scene requires authentication
}

export interface KnackViewColumn {
  type: string;
  field?: { key: string };
  align?: string;
  rules?: any[];
  width?: any;
  header?: string;
  icon?: any;
  grouping?: boolean;
  sortable?: boolean;
  conn_link?: string;
  link_text?: string;
  link_type?: string;
  scene?: string;
  // For details view alternative structure
  groups?: KnackColumnGroup[];
}

export interface KnackColumnGroup {
  columns?: Array<Array<KnackColumnField> | KnackColumnField>;
}

export interface KnackColumnField {
  key?: string;
  name?: string;
}

export interface KnackViewInput {
  id?: string;
  key?: string;
  type?: string;
  field?: { key: string };
  label?: string;
}

export interface KnackViewField {
  name?: string;
  field?: string;
  key?: string;
  operator?: string;
  value?: any;
  multi_type?: string;
  multi_input?: string;
  multi_match?: string;
  ignore_operators?: boolean;
  operator_default?: string;
}

export interface KnackViewGroup {
  columns?: {
    inputs?: KnackViewInput[];
    fields?: KnackViewField[];
  }[];
}

export interface KnackViewResults {
  type?: string;
  columns?: KnackViewColumn[];
  source?: any;
}

export interface KnackView {
  _id: string;
  key: string;
  name: string;
  type: string;
  title?: string;
  source?: {
    object: string;
    sort?: { field: string; order: string }[];
    limit?: string | null;
    criteria?: any;
    authenticated_user?: boolean;
    connection_key?: string;
    relationship_type?: string;
    filters?: any[];
  };
  results?: KnackViewResults;
  columns?: KnackViewColumn[];
  links?: any[];
  inputs?: KnackViewInput[];
  groups?: KnackViewGroup[];
  totals?: any[];
  description?: string;
  hide_empty?: boolean;
  hide_fields?: boolean;
  label_format?: string;
  results_type?: string;
  allow_exporting?: boolean;
  submit_button_text?: string;
  table_design_active?: boolean;
  keyword_search_fields?: string;

  // Authentication & security properties
  allowed_profiles?: string[]; // Profiles allowed to access this view
  limit_profile_access?: boolean; // Whether to limit access to specific profiles
}
