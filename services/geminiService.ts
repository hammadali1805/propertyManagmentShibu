
import { GoogleGenAI } from "@google/genai";
import { Bill } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getEnergyInsights = async (bills: Bill[]): Promise<string> => {
  // Fixed: Removed non-existent property 'consumption' from type 'Bill'.
  // Also added nullish coalescing for 'amount' as it is optional in the interface.
  const historyString = bills
    .map(b => `${b.billingDate}: ₹${b.amount ?? 'N/A'} - ${b.status}`)
    .join("\n");

  const prompt = `
    As an energy consultant, analyze the following electricity bill history and provide 3 short, actionable energy-saving tips.
    Format the response in professional markdown with clear bullet points.
    
    BILL HISTORY:
    ${historyString}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.8,
      },
    });
    // Use the .text property to directly access the generated string. Do not call .text().
    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI consultant is currently offline. Please check your energy usage patterns manually.";
  }
};

export const getAdminBriefing = async (unpaidBills: Bill[]): Promise<string> => {
  // Fixed: Added nullish coalescing for 'amount' as it is optional in the interface.
  const data = unpaidBills.map(b => `₹${b.amount ?? 'N/A'} for ${b.billingDate}`).join(", ");
  
  const prompt = `
    Analyze these outstanding electricity bills and provide a one-paragraph management summary for the admin. 
    Focus on urgency and total impact.
    
    UNPAID DATA: ${data}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Use the .text property to access generated content
    return response.text || "No summary available.";
  } catch (error) {
    return "Error generating administrative summary.";
  }
};
