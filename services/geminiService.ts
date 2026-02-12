import { GoogleGenAI, Type } from "@google/genai";

// Helper to convert Blob to Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function parseItemsFromResponse(text: string | undefined): string[] {
  if (!text) return [];
  const parsed = JSON.parse(text);
  return parsed.items || [];
}

export const extractListFromAudio = async (audioBlob: Blob): Promise<string[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey });
    const base64Audio = await blobToBase64(audioBlob);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type,
              data: base64Audio
            }
          },
          {
            text: "Listen to this audio carefully. The user is dictating items for a shared couple's list (like groceries, chores, or plans). Extract the distinct items mentioned. Return them as a simple JSON array of strings. If no clear items are found, return an empty array."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of extracted items"
            }
          }
        }
      }
    });

    return parseItemsFromResponse(response.text);

  } catch (error) {
    console.error("Error extracting list from audio:", error);
    throw error;
  }
};
