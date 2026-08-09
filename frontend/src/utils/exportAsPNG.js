import html2canvas from "html2canvas";

export const exportAsPNG = async (elementId, fileName) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }
  try {
    const rect = element.getBoundingClientRect();
    const isWiderThanViewport = rect.width > window.innerWidth;
    
    // Scale by devicePixelRatio * 2 if the element is wider than the viewport, else default to 2
    const scale = isWiderThanViewport ? (window.devicePixelRatio * 2) : 2;

    const options = {
      backgroundColor: "#FFFFFF",
      scale: scale,
      useCORS: true
    };
    const canvas = await html2canvas(element, options);
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Error exporting element to PNG:", error);
  }
};
