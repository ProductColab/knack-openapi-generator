import { KnackSchema, KnackScene, KnackView } from "../types/knackSchema";

/**
 * Checks if a scene is a child page that requires a parent record ID
 */
export function isChildPage(scene: KnackScene): boolean {
  // A scene is a child page if it has a parent property with a value
  return Boolean(scene.parent);
}

/**
 * Checks if a view is in a child page
 * @param view - The view to check
 * @param scene - The scene containing the view
 */
export function isViewInChildPage(view: KnackView, scene: KnackScene): boolean {
  // A view is in a child page if its containing scene is a child page
  return isChildPage(scene);
}

/**
 * Gets the parent parameter slug for a child page
 */
export function getParentParamSlug(
  scene: KnackScene,
  schema: KnackSchema
): string | null {
  // If this is not a child page, return null
  if (!isChildPage(scene)) {
    return null;
  }

  // Find the parent scene by slug
  const parentScene = schema.application.scenes.find(
    (s) => s.slug === scene.parent
  );

  if (parentScene) {
    // Get slug for the parent's object (if available)
    const parentObjectKey = getSceneObjectKey(parentScene);
    if (parentObjectKey) {
      return `${parentScene.slug}_id`;
    }
  }

  // Fall back to using the parent slug directly
  return `${scene.parent}_id`;
}

/**
 * Gets the primary object key associated with a scene
 */
function getSceneObjectKey(scene: KnackScene): string | null {
  // Check the first view with a source object
  const firstViewWithObject = scene.views.find((view) => view.source?.object);
  if (firstViewWithObject?.source?.object) {
    return firstViewWithObject.source.object;
  }

  return null;
}

/**
 * Finds an object in the schema by connection key
 * @param connectionKey - The connection key to search for
 * @param schema - The Knack schema to search in
 * @returns The matching object or undefined
 * @internal
 */
export function findObjectByConnectionKey(
  connectionKey: string,
  schema: KnackSchema
) {
  return schema.application.objects.find((obj) => {
    return obj.fields.some((field) => field.key === connectionKey);
  });
}

/**
 * Finds an object in the schema by name (approximate match)
 * @param name - The name to search for
 * @param schema - The Knack schema to search in
 * @returns The matching object or undefined
 * @internal
 */
export function findObjectByName(name: string, schema: KnackSchema) {
  const nameLower = name.toLowerCase();
  return schema.application.objects.find((obj) => {
    return (
      obj.name.toLowerCase() === nameLower ||
      obj.inflections.singular.toLowerCase() === nameLower ||
      obj.inflections.plural.toLowerCase() === nameLower
    );
  });
}
