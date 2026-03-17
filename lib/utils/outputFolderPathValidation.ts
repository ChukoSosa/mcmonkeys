/**
 * Validates an output folder path for security and platform compatibility.
 * Returns validation result with optional error message.
 */
export function validateOutputFolderPath(path: string): { valid: boolean; error?: string } {
  const normalized = path.trim();

  if (!normalized) {
    return { valid: false, error: "Path cannot be empty" };
  }

  if (normalized.length > 260) {
    return { valid: false, error: "Path too long (maximum 260 characters)" };
  }

  const invalidCharsRegex = /[<>:"|?*\x00-\x1f]/g;
  if (invalidCharsRegex.test(normalized)) {
    return { valid: false, error: "Path contains invalid characters: < > : \" | ? *" };
  }

  if (normalized.includes("..")) {
    return { valid: false, error: "Path traversal (..) is not allowed" };
  }

  if (normalized.startsWith("/") || normalized.startsWith("\\\\")) {
    return { valid: false, error: "Absolute paths not allowed. Use relative paths like 'mcmonkeys'" };
  }

  if (normalized.includes("$") || normalized.includes("%")) {
    return { valid: false, error: "Environment variable references not allowed" };
  }

  return { valid: true };
}