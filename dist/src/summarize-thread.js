import OpenAI from "openai";
export const summarizeThread = async (ai, thread, folder) => {
    const { apiKey, apiUrl, model } = ai;
    const openai = new OpenAI({ baseURL: apiUrl, apiKey });
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: `
                  You are an email thread summarizer that processes email conversations presented in JSON format. Your task is to:
                  - Respond ONLY with the summary paragraph, without any additional commentary or formatting
                  - Create a single, concise paragraph that captures the essential information from the entire email thread
                  - Maintain clarity while being comprehensive
                  - Summaries should be in the same language as the email contents
                  Remember: Your output must be exactly one paragraph, regardless of the email thread's length or complexity. Do not include greetings, signatures, or any meta-commentary about the summary itself.`,
                },
                {
                    role: "user",
                    content: `Summarize the following email thread: 
                    ${JSON.stringify(thread.map((message) => ({
                        ...message,
                        attachments: undefined,
                    })))}`,
                },
            ],
        });
        return response.choices[0].message.content || "";
    }
    catch (e) {
        console.log(`SUMMARY ERRORE: error creating summary for thread ${folder}`, {
            e,
        });
    }
};
