import { KnackSchema, KnackView, KnackScene } from "../types/knackSchema";

/**
 * Security types for views
 */
export enum ViewSecurity {
  PUBLIC = "public",
  AUTHENTICATED = "authenticated",
}

/**
 * Determines if a view requires authentication
 */
export function determineViewSecurity(
  view: KnackView,
  scene: KnackScene,
  schema: KnackSchema
): ViewSecurity {
  // Check direct authentication requirements on the view
  const viewSecurity = checkViewSecurity(view);
  if (viewSecurity !== null) {
    return viewSecurity;
  }

  // Check direct authentication requirements on the scene
  const sceneSecurity = checkSceneSecurity(scene);
  if (sceneSecurity !== null) {
    return sceneSecurity;
  }

  // Check if any parent scenes require authentication
  const parentSecurity = checkParentScenesSecurity(scene, schema);
  if (parentSecurity !== null) {
    return parentSecurity;
  }

  // Default to public for known safe view types
  if (["landing", "menu", "search", "rich_text"].includes(view.type)) {
    return ViewSecurity.PUBLIC;
  }

  // Default to authenticated for everything else
  // This is safer than potentially exposing protected data
  return ViewSecurity.AUTHENTICATED;
}

/**
 * Checks if a view has direct authentication requirements
 * Returns null if inconclusive
 */
function checkViewSecurity(view: KnackView): ViewSecurity | null {
  // Check if it's a login view (these are public by nature)
  if (
    view.type === "login" ||
    view.type === "register" ||
    view.type === "password_reset"
  ) {
    return ViewSecurity.PUBLIC;
  }

  // Check if the view has allowed_profiles restriction
  if (
    view.allowed_profiles &&
    Array.isArray(view.allowed_profiles) &&
    view.allowed_profiles.length > 0
  ) {
    return ViewSecurity.AUTHENTICATED;
  }

  // Check if the view has limit_profile_access flag
  if (view.limit_profile_access === true) {
    return ViewSecurity.AUTHENTICATED;
  }

  // Check the source for authenticated_user flag
  if (
    view.source &&
    typeof view.source === "object" &&
    view.source !== null &&
    view.source.authenticated_user === true
  ) {
    return ViewSecurity.AUTHENTICATED;
  }

  // Check view title or description for keywords suggesting authentication
  const securityKeywords = [
    "profile",
    "account",
    "dashboard",
    "admin",
    "secure",
    "private",
  ];
  const viewText = `${view.name} ${view.title || ""} ${
    view.description || ""
  }`.toLowerCase();
  if (securityKeywords.some((keyword) => viewText.includes(keyword))) {
    return ViewSecurity.AUTHENTICATED;
  }

  return null;
}

/**
 * Checks if a scene has direct authentication requirements
 * Returns null if inconclusive
 */
function checkSceneSecurity(scene: KnackScene): ViewSecurity | null {
  // Check if the scene is explicitly authenticated
  if (scene.authenticated === true) {
    return ViewSecurity.AUTHENTICATED;
  }

  // Check if the scene is an authentication scene (login page)
  if (scene.type === "authentication") {
    return ViewSecurity.PUBLIC;
  }

  // Check if the scene has allowed_profiles restriction
  if (
    scene.allowed_profiles &&
    Array.isArray(scene.allowed_profiles) &&
    scene.allowed_profiles.length > 0
  ) {
    return ViewSecurity.AUTHENTICATED;
  }

  // Check if the scene has limit_profile_access flag
  if (scene.limit_profile_access === true) {
    return ViewSecurity.AUTHENTICATED;
  }

  // Check if the scene name suggests authentication
  const securityKeywords = [
    "profile",
    "account",
    "dashboard",
    "admin",
    "secure",
    "private",
  ];
  const sceneNameLower = scene.name.toLowerCase();
  if (securityKeywords.some((keyword) => sceneNameLower.includes(keyword))) {
    return ViewSecurity.AUTHENTICATED;
  }

  return null;
}

/**
 * Recursively checks parent scenes for authentication requirements
 * Returns null if no parent requires authentication
 */
function checkParentScenesSecurity(
  scene: KnackScene,
  schema: KnackSchema,
  visited: Set<string> = new Set()
): ViewSecurity | null {
  // Prevent infinite loops in case of circular references
  if (!scene.parent || visited.has(scene.parent)) {
    return null;
  }

  // Mark this parent as visited
  visited.add(scene.parent);

  // Find the parent scene
  const parentScene = schema.application.scenes.find(
    (s) => s.slug === scene.parent
  );
  if (!parentScene) {
    return null;
  }

  // Check the parent scene's security
  const parentSecurity = checkSceneSecurity(parentScene);
  if (parentSecurity !== null) {
    return parentSecurity;
  }

  // Recursively check the parent's parent
  return checkParentScenesSecurity(parentScene, schema, visited);
}
