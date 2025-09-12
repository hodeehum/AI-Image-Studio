/**
 * Converts an image from a data URL to a PNG format and triggers a download.
 * @param dataUrl The data URL of the image to convert (e.g., from JPEG, GIF, etc.).
 * @param fileName The desired file name for the downloaded PNG image.
 */
export const convertToPngAndDownload = (dataUrl: string, fileName: string): void => {
  const image = new Image();
  image.src = dataUrl;
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(image, 0, 0);
      const pngDataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngDataUrl;
      link.download = fileName.endsWith('.png') ? fileName : `${fileName.split('.')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Could not get canvas context to convert image.");
      // Fallback to direct download if canvas fails
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  image.onerror = () => {
    console.error("Failed to load image for conversion.");
  }
};
