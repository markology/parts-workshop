import { toJpeg } from 'html-to-image';

/**
 * Captures a React Flow viewport as a thumbnail
 * @param reactFlowInstance - The React Flow instance from useReactFlow() hook
 * @returns A base64 encoded JPEG string
 */
export const captureThumbnail = async (reactFlowInstance: any): Promise<string | null> => {
  try {
    if (!reactFlowInstance) return null;

    const viewport = reactFlowInstance.getViewport();
    const bounds = reactFlowInstance.getNodesBounds(reactFlowInstance.getNodes());
    
    if (!bounds) return null;

    // Get the React Flow pane element
    const paneElement = document.querySelector('.react-flow__pane');
    if (!paneElement || !(paneElement instanceof HTMLElement)) return null;

    // Capture the visible viewport
    const dataUrl = await toJpeg(paneElement, {
      quality: 0.8,
      pixelRatio: 0.5, // Reduce resolution for thumbnails
      backgroundColor: '#1f2937', // Dark background for thumbnails
      width: 800,
      height: 450,
    });

    return dataUrl;
  } catch (error) {
    console.error('Failed to capture thumbnail:', error);
    return null;
  }
};

