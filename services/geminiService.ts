
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InvoiceData } from "../types";

const invoiceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    clientName: { type: Type.STRING, description: "Name of the client or company receiving the invoice." },
    clientAddress: { type: Type.STRING, description: "Address of the client if mentioned in the notes." },
    invoiceDate: { type: Type.STRING, description: "Date of the invoice generation or the main date of the trip." },
    invoiceNumber: { type: Type.STRING, description: "A generated invoice number (e.g., INV-001)." },
    status: { type: Type.STRING, enum: ["PAID", "PENDING", "OVERDUE"], description: "Status of the invoice. Default to PENDING." },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "Date of the specific trip." },
          description: { type: Type.STRING, description: "Route, trip details, pickup/dropoff points." },
          timeIn: { type: Type.STRING, description: "Pickup time or start time, if available." },
          timeOut: { type: Type.STRING, description: "Dropoff time or end time, if available." },
          amount: { type: Type.NUMBER, description: "Cost of the trip." },
        },
        required: ["date", "description", "amount"],
      },
    },
    subtotal: { type: Type.NUMBER, description: "Sum of all items." },
    totalAmount: { type: Type.NUMBER, description: "Final total amount." },
    closingMessage: { type: Type.STRING, description: "A short, polite closing message including payment terms if applicable." },
  },
  required: ["clientName", "items", "totalAmount", "closingMessage"],
};

export const parseInvoiceFromNotes = async (
  text: string,
  imageBase64?: string,
  imageMime: string = "image/jpeg",
  audioBase64?: string,
  audioMime: string = "audio/mp3",
  context?: { clientName?: string; invoiceNumber?: string; invoiceDate?: string }
): Promise<InvoiceData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are the Keeper of Journeys and the Writer of Roads.
    Your duty is to transform rough notes, scattered times, handwritten trips, or SPOKEN voice notes into a clean, professional car-hire invoice data structure.
    
    **CONTEXT FROM USER:**
    - The user may have already manually entered: 
      Client Name: "${context?.clientName || 'Unknown'}"
      Invoice Number: "${context?.invoiceNumber || 'Auto-generate'}"
      Date: "${context?.invoiceDate || 'Today'}"
    - **Use these values** in the final JSON if they are provided and not contradicted by the notes.
    
    **LANGUAGE & CURRENCY INSTRUCTION:**
    1. **Context**: The user is likely in **Nigeria**. 
    2. **Currency**: If no currency is explicitly stated, assume **Naira (₦)**. Treat "k" as thousands (e.g., "5k" = 5000, "10k" = 10000).
    3. **Language**: The input may be in English, or a **mix of English and Yoruba (Code-switching)**.
    
    You must:
    1. Listen/Read carefully to understand the context in both languages.
    2. **Translate** any Yoruba instructions, locations, or notes into professional **English** for the final invoice.
    3. For example, if you hear "Drop e si Lagos Island, owo wa ni 5k", translate that to "Drop-off at Lagos Island" and Amount 5000.
    4. **Status**: Default to 'PENDING' unless the user specifically notes that it is already "Paid" or "Overdue".

    Rules:
    1. Understand dates, places, times, pickup/drop-off points, and amounts.
    2. If the total is missing, calculate it by summing the amounts.
    3. If names or places repeat, organize them clearly.
    4. Rewrite informal text into professional descriptions.
    5. Create a polite closing message.
    6. Extract data strictly into the requested JSON format.
    7. If an address for the client is present, extract it.
    8. If the input is completely unintelligible or not related to trips, return an empty structure with a polite error in the clientName (but if context client name exists, keep it).
  `;

  const parts: any[] = [];
  
  // Add Image if exists
  if (imageBase64) {
    parts.push({
      inlineData: {
        data: imageBase64,
        mimeType: imageMime,
      },
    });
  }

  // Add Audio if exists
  if (audioBase64) {
    parts.push({
      inlineData: {
        data: audioBase64,
        mimeType: audioMime,
      },
    });
  }

  // Add Text if exists
  if (text) {
    parts.push({
      text: text,
    });
  }

  // Validation
  if (parts.length === 0) {
    throw new Error("Please provide notes, an image, or a voice recording.");
  }

  // Prompt refinement based on input type
  if (!text && audioBase64) {
      parts.push({ text: "Listen to this voice note (possibly Yoruba/English mix) and extract the invoice details into professional English. Assume Nigerian Context." });
  } else if (!text && imageBase64) {
      parts.push({ text: "Extract the trip details from this image into the invoice format. Assume Nigerian Context." });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: parts,
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text) as InvoiceData;
      // Ensure status has a default if AI omits it
      if (!parsed.status) parsed.status = 'PENDING';
      return parsed;
    } else {
      throw new Error("No data returned from the Keeper.");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
