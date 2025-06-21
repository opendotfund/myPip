import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { GEMINI_MODEL_NAME, HARDCODED_API_KEY } from '../constants';
import { GeminiResponse } from "../types";

// Use the hardcoded API key as the default
let currentApiKey: string | null = HARDCODED_API_KEY;
let ai: GoogleGenAI | null = null;

const initializeAiClient = () => {
  if (currentApiKey && currentApiKey.trim() !== "") {
    try {
      ai = new GoogleGenAI({ apiKey: currentApiKey });
      // Log only the last 4 characters of the key for security reasons in console.
      const keySnippet = currentApiKey.length > 4 ? `...${currentApiKey.slice(-4)}` : '(key too short to snip)';
      console.log(`Gemini AI client initialized/re-initialized successfully with key ending: ${keySnippet}.`);
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI client with the current key:", error);
      ai = null; // Ensure ai is null if initialization fails
    }
  } else {
    ai = null; // Ensure ai is null if no valid key
    console.warn("API Key is not set or is empty. AI client not initialized.");
  }
};

// Initialize the AI client with the hardcoded key
initializeAiClient();

if (!currentApiKey) { 
  console.warn("No API Key was available. Gemini services will not function.");
} else if (currentApiKey && !ai) { // currentApiKey was present but client failed to initialize
  console.error("CRITICAL: An API Key was provided, but the AI client failed to initialize. Please check the key and console for errors from GoogleGenAI constructor.");
}

export const setExternalApiKey = async (newApiKey: string): Promise<boolean> => {
  if (!newApiKey || typeof newApiKey !== 'string' || !newApiKey.trim()) {
    console.error("Attempted to set an empty or invalid API key. Reverting to initial env key if available, or null.");
    currentApiKey = HARDCODED_API_KEY || null; // Revert to initial state
    initializeAiClient(); // Re-initialize with the reverted key
    return false;
  }
  
  const trimmedNewApiKey = newApiKey.trim();
  const keySnippet = trimmedNewApiKey.length > 4 ? `...${trimmedNewApiKey.slice(-4)}` : '(key too short to snip)';
  console.log(`Attempting to set and use new API key ending: ${keySnippet}`);
  
  currentApiKey = trimmedNewApiKey; // Update currentApiKey to the new one
  initializeAiClient(); // Re-initialize the 'ai' client with the new 'currentApiKey'
  
  if (ai !== null) {
    console.log(`Successfully applied new API key. AI client is now active with the new key.`);
    return true;
  } else {
    console.error(`Failed to activate AI client with the newly provided API key (ending: ${keySnippet}). The key might be invalid or malformed.`);
    // Optionally, decide if you want to revert to initialEnvApiKey if the new key fails
    // For now, it will keep 'currentApiKey' as the user-provided (but failed) key, and 'ai' will be null.
    // This means subsequent calls will fail until a valid key is provided.
    return false;
  }
};

const parseGeminiJsonResponse = (responseText: string): GeminiResponse => {
  let jsonStr = responseText.trim();
    
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  jsonStr = jsonStr.replace(/\\n/g, "\\n")
                   .replace(/\\'/g, "\\'")
                   .replace(/\\"/g, '\\"')
                   .replace(/\\&/g, "\\&")
                   .replace(/\\r/g, "\\r")
                   .replace(/\\t/g, "\\t")
                   .replace(/\\b/g, "\\b")
                   .replace(/\\f/g, "\\f");
  
  try {
    const parsedData = JSON.parse(jsonStr) as GeminiResponse;
    if (!parsedData.swiftCode || !parsedData.previewHtml) {
      console.error("Parsed data missing swiftCode or previewHtml", parsedData);
      throw new Error("Invalid response structure from AI. Missing swiftCode or previewHtml.");
    }
    if (parsedData.previewHtml.trim() === "") {
        parsedData.previewHtml = '<div class="p-4 text-center text-neutral-500">AI returned an empty preview. Try adjusting your prompt.</div>';
    }
    if (parsedData.swiftCode.trim() === "") {
        parsedData.swiftCode = "// AI returned empty code. Try adjusting your prompt.";
    }
    return parsedData;
  } catch(e) {
    console.error("Failed to parse JSON string:", jsonStr, e);
    throw new Error(`Failed to parse AI's JSON response. Raw: ${jsonStr.substring(0,200)}...`);
  }
};

const constructInitialGeminiPrompt = (userPrompt: string): Content[] => {
  const systemInstruction = `
You are an expert iOS app developer and UI designer. The user wants to build an iOS app.
Based on the following user prompt:
"${userPrompt}"

Generate the following:
1.  **SwiftUI Code**: Complete, functional SwiftUI code for a single-screen iOS application or component that implements the user's request. Assume a modern iOS target. The code should be self-contained within a single SwiftUI View struct if possible. Ensure the code is valid SwiftUI.
2.  **HTML Preview**: A simple HTML snippet using Tailwind CSS classes that visually represents the UI described by the user. This HTML should be suitable for rendering in a web-based preview pane that mimics a phone screen.
    -   Keep the HTML structure minimal.
    -   Do NOT include <script> tags or external CSS links other than what Tailwind provides by default.
    -   Use placeholder images (e.g., from https://picsum.photos/width/height) if necessary.
    -   The HTML should be a single, self-contained block of markup designed to look like a mobile app screen.
    -   Ensure content is visible on a white background (e.g., use dark text like text-neutral-700).
    -   **CRITICAL**: For any interactive elements in the HTML preview (buttons, links that simulate app actions), you MUST add these exact data attributes:
        -   \`data-action-id="UNIQUE_ACTION_IDENTIFIER"\`: A concise, unique identifier for the action this element performs. Use descriptive camelCase names like:
            - \`addItem\`, \`deleteItem\`, \`editItem\` for list management
            - \`submitForm\`, \`saveData\`, \`cancelForm\` for form actions
            - \`viewDetails\`, \`navigateTo\`, \`goBack\` for navigation
            - \`toggleSwitch\`, \`toggleMenu\`, \`toggleView\` for state toggles
            - \`selectItem\`, \`chooseOption\`, \`pickCategory\` for selections
        -   \`data-action-description="User-friendly description of the action"\`: A short phrase describing what the button does (e.g., "Add new item to list", "Submit user data", "View product details").
    -   **IMPORTANT**: Make all interactive elements clearly clickable by adding these Tailwind classes: \`cursor-pointer hover:opacity-80 transition-opacity\`
    -   **Example button**: \`<button data-action-id="addItem" data-action-description="Add new item to list" class="bg-blue-500 text-white p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity">Add Item</button>\`
    -   **Example link**: \`<a href="#" data-action-id="viewDetails" data-action-description="View item details" class="text-blue-600 underline cursor-pointer hover:opacity-80 transition-opacity">View Details</a>\`

**IMPORTANT**: ALWAYS include at least 2-3 interactive elements in your HTML preview to demonstrate the app's functionality. These should be meaningful actions that users would actually want to perform in the app.

Return your response as a single JSON object with the following exact structure:
{
  "swiftCode": "SWIFTUI_CODE_HERE",
  "previewHtml": "HTML_PREVIEW_CODE_HERE"
}

Ensure the swiftCode and previewHtml are valid, properly escaped strings within the JSON structure.
If the user prompt is vague, try to create a common, simple app screen related to the prompt, including appropriate interactive elements with data attributes.
`;
  return [{ role: "user", parts: [{ text: systemInstruction }] }];
};

const constructRefinementGeminiPrompt = (currentSwiftCode: string, currentHtmlPreview: string, refinementRequest: string): Content[] => {
  const systemInstruction = `
You are an expert iOS app developer and UI designer. You have previously generated an iOS app.
The current SwiftUI code is:
\`\`\`swift
${currentSwiftCode}
\`\`\`

The current HTML preview code is:
\`\`\`html
${currentHtmlPreview}
\`\`\`

Now, the user wants to refine this app with the following request:
"${refinementRequest}"

Based on this refinement request, update BOTH the SwiftUI code AND the HTML preview.
Ensure the updated SwiftUI code is complete and functional for a single screen.
Ensure the updated HTML preview accurately reflects the refined UI, using Tailwind CSS, and is suitable for a phone screen preview.

**CRITICAL**: For any interactive elements in the updated HTML preview (buttons, links that simulate app actions), you MUST add or update these exact data attributes:
    -   \`data-action-id="UNIQUE_ACTION_IDENTIFIER"\`: A concise, unique identifier for the action this element performs. Use descriptive camelCase names like:
        - \`addItem\`, \`deleteItem\`, \`editItem\` for list management
        - \`submitForm\`, \`saveData\`, \`cancelForm\` for form actions
        - \`viewDetails\`, \`navigateTo\`, \`goBack\` for navigation
        - \`toggleSwitch\`, \`toggleMenu\`, \`toggleView\` for state toggles
        - \`selectItem\`, \`chooseOption\`, \`pickCategory\` for selections
    -   \`data-action-description="User-friendly description of the action"\`: A short phrase describing what the button does (e.g., "Add new item to list", "Submit user data", "View product details").
**IMPORTANT**: Make all interactive elements clearly clickable by adding these Tailwind classes: \`cursor-pointer hover:opacity-80 transition-opacity\`

**IMPORTANT**: ALWAYS include at least 2-3 interactive elements in your HTML preview to demonstrate the app's functionality. These should be meaningful actions that users would actually want to perform in the app.

Return your response as a single JSON object with the following exact structure:
{
  "swiftCode": "UPDATED_SWIFTUI_CODE_HERE",
  "previewHtml": "UPDATED_HTML_PREVIEW_CODE_HERE"
}

Ensure the swiftCode and previewHtml are valid, properly escaped strings within the JSON structure.
The HTML preview should be a self-contained block of markup.
`;
  return [{ role: "user", parts: [{ text: systemInstruction }] }];
};

const constructInteractionGeminiPrompt = (currentSwiftCode: string, currentHtmlPreview: string, actionId: string, actionDescription: string): Content[] => {
  const systemInstruction = `
You are an expert iOS app developer and UI designer.
The current SwiftUI code for an app is:
\`\`\`swift
${currentSwiftCode}
\`\`\`

The current HTML preview for this app is:
\`\`\`html
${currentHtmlPreview}
\`\`\`

The user has just interacted with an element in the HTML preview.
- Interaction Element ID: \`${actionId}\`
- Interaction Element Description: \`${actionDescription}\`

This interaction signifies the user's intent to trigger the behavior associated with this element in the iOS app.

**CRITICAL INSTRUCTIONS FOR HANDLING INTERACTIONS:**

1. **ALWAYS make a VISIBLE change** to the app state when an interaction occurs. The user should see something different after clicking.

2. **Common interaction patterns to implement:**
   - **Navigation actions** (viewDetails, navigateTo, goBack): Show a new screen or overlay
   - **Data actions** (addItem, deleteItem, submitForm): Update lists, show success messages, or change form state
   - **Toggle actions** (toggleSwitch, toggleMenu): Change boolean states and update UI accordingly
   - **Selection actions** (selectItem, chooseOption): Highlight selected items or update selection state
   - **Action buttons** (save, cancel, confirm): Show loading states, success messages, or navigate away

3. **Update BOTH the SwiftUI code AND HTML preview** to reflect the new state:
   - Add or modify @State variables to track the new state
   - Update the UI to show the result of the interaction
   - Ensure the HTML preview visually represents the new state
   - Add appropriate feedback (success messages, loading states, etc.)

4. **Make the changes obvious and meaningful** - don't just change text, make functional changes that users would expect from the interaction.

Your task is to:
1. Analyze the \`${actionId}\` and \`${actionDescription}\` to understand the user's intended action.
2. Update the **SwiftUI code** to implement the outcome of this action with visible state changes.
3. Update the **HTML preview** to visually represent the new state of the app AFTER this interaction has occurred.
4. Ensure the updated HTML preview includes \`data-action-id\` and \`data-action-description\` attributes on its interactive elements.

**Example responses:**
- If user clicks "Add Item" → Add an item to a list and show a success message
- If user clicks "View Details" → Show a detailed view or modal
- If user clicks "Submit Form" → Show loading state, then success message
- If user clicks "Toggle Switch" → Change the switch state and update related UI

Return your response as a single JSON object with the following exact structure:
{
  "swiftCode": "UPDATED_SWIFTUI_CODE_AFTER_INTERACTION_HERE",
  "previewHtml": "UPDATED_HTML_PREVIEW_AFTER_INTERACTION_HERE"
}

Ensure the swiftCode and previewHtml are valid, properly escaped strings within the JSON structure.
Focus on making the SwiftUI code reflect the direct consequence of the specified user interaction with VISIBLE changes.
The updated HTML preview must accurately reflect the new app state and show what changed.
`;
  return [{ role: "user", parts: [{ text: systemInstruction }] }];
};

const callGeminiApi = async (structuredContents: Content[]): Promise<GeminiResponse> => {
  if (!ai) {
    console.warn("Gemini API client not initialized at call time.");
    if (currentApiKey && currentApiKey.trim() !== "") {
      console.warn(`An API key is configured (ending ${currentApiKey.length > 4 ? `...${currentApiKey.slice(-4)}` : '(key too short)'}), attempting to re-initialize client...`);
      initializeAiClient(); 
    }
    
    if (!ai) {
      const errMessage = currentApiKey && currentApiKey.trim() !== "" 
        ? "Gemini API client could not be initialized even though an API key is present. The key might be invalid or there's a configuration issue."
        : "Gemini API client is not initialized. An API Key is required. Please provide one via the 'Early Bird API' input if available, or ensure environment key is set up.";
      console.error(errMessage);
      throw new Error(errMessage);
    }
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: structuredContents, // Use the structured Content[]
      config: {
        responseMimeType: "application/json",
      },
    });
    
    return parseGeminiJsonResponse(response.text);

  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("The provided API Key is not valid. Please check the key and try again.");
        }
        if (error.message.toLowerCase().includes("quota") || (error as any)?.status === 429) {
            throw new Error("API quota exceeded. Please check your quota or try again later.");
        }
        if (error.message.includes("SAFETY")) {
             throw new Error("The AI generated a response that couldn't be shown due to safety settings. Please try a different prompt.");
        }
        // Check for NotSupportedError specifically (as seen in the user's error)
        if (error.name === 'NotSupportedError' || error.message.includes("ReadableStream uploading is not supported")) {
            throw new Error(`AI API Error: ReadableStream uploading is not supported by the proxy server. Please check the proxy configuration. Original detail: ${error.message}`);
        }
        throw new Error(`AI API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI.");
  }
};

export const generateAppCodeAndPreview = async (userPrompt: string): Promise<GeminiResponse> => {
  const contents = constructInitialGeminiPrompt(userPrompt);
  return callGeminiApi(contents);
};

export const refineAppCodeAndPreview = async (currentSwiftCode: string, currentHtmlPreview: string, refinementRequest: string): Promise<GeminiResponse> => {
  const contents = constructRefinementGeminiPrompt(currentSwiftCode, currentHtmlPreview, refinementRequest);
  return callGeminiApi(contents);
};

export const handleInteractionAndUpdateCodeAndPreview = async (currentSwiftCode: string, currentHtmlPreview: string, actionId: string, actionDescription: string): Promise<GeminiResponse> => {
  const contents = constructInteractionGeminiPrompt(currentSwiftCode, currentHtmlPreview, actionId, actionDescription);
  return callGeminiApi(contents);
};
