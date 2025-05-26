/**
 * Utility functions for accessibility
 */

/**
 * Generates an accessible title attribute for external links
 *
 * @param description Description of the link's purpose (if different from the link text)
 * @param linkText The visible text of the link (used if description is not provided)
 * @returns Formatted title attribute with indication that it opens in a new window
 */
export const getExternalLinkTitle = (description?: string, linkText?: string): string => {
  const baseDescription = description || linkText || "";
  return `${baseDescription} - ouvre une nouvelle fenêtre`;
};
