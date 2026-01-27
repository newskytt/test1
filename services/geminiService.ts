
import { GoogleGenAI, Type } from "@google/genai";
import { Priority, AISuggestion } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const suggestTaskDetails = async (taskText: string): Promise<AISuggestion> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `分析这个任务并用中文建议优先级（低、中、高）和类别： "${taskText}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          priority: {
            type: Type.STRING,
            description: "建议的优先级：低, 中, 或 高",
          },
          category: {
            type: Type.STRING,
            description: "简短的类别名称（例如：工作、个人、健康）",
          },
          reason: {
            type: Type.STRING,
            description: "一条简短的中文建议理由",
          }
        },
        required: ["priority", "category", "reason"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    let priority = Priority.MEDIUM;
    if (data.priority === '低' || data.priority === 'Low') priority = Priority.LOW;
    if (data.priority === '中' || data.priority === 'Medium') priority = Priority.MEDIUM;
    if (data.priority === '高' || data.priority === 'High') priority = Priority.HIGH;

    return {
      priority,
      category: data.category || "常规",
      reason: data.reason || ""
    };
  } catch (e) {
    console.error("Failed to parse AI suggestion", e);
    return { priority: Priority.MEDIUM, category: "常规", reason: "" };
  }
};

export const decomposeTask = async (taskText: string): Promise<string[]> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `请将此任务拆分为 3-5 个清晰、可操作的中文子步骤： "${taskText}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "子步骤列表"
          }
        },
        required: ["steps"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data.steps || [];
  } catch (e) {
    console.error("Failed to parse task decomposition", e);
    return [];
  }
};

export const getMotivationalQuote = async (): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "请给我一句简短有力的中文励志名言，鼓励今天的生产力。保持在20个字以内。",
  });
  return response.text || "专注于当下的每一个小胜利。";
};
