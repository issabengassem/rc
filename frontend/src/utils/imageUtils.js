export const SALON_IMAGE_FALLBACK = `${
  process.env.PUBLIC_URL || ""
}/salon-placeholder.svg`;

export const hasSalonImagePath = (imagePath) =>
  typeof imagePath === "string" && imagePath.trim().length > 0;

export const resolveImageUrl = (
  imagePath,
  buildLocalUrl,
  buildExternalImageProxyUrl,
) => {
  if (!hasSalonImagePath(imagePath)) {
    return SALON_IMAGE_FALLBACK;
  }

  const trimmedPath = imagePath.trim();

  if (trimmedPath.startsWith("data:image/")) {
    return trimmedPath;
  }

  if (trimmedPath.startsWith("/")) {
    return trimmedPath;
  }

  if (/^https?:\/\//i.test(trimmedPath)) {
    if (
      buildExternalImageProxyUrl &&
      /^https:\/\/([^/]+\.)?googleusercontent\.com\//i.test(trimmedPath)
    ) {
      return buildExternalImageProxyUrl(trimmedPath);
    }

    return trimmedPath;
  }

  return buildLocalUrl(trimmedPath);
};

export const handleSalonImageError = (event) => {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied === "true") {
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = SALON_IMAGE_FALLBACK;
};
