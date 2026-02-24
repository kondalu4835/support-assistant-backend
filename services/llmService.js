const { ChatMistralAI } = require("@langchain/mistralai");
const { HumanMessage, SystemMessage, AIMessage } = require("@langchain/core/messages");
const { findRelevantDocs } = require("./embeddingService");

let chatModel;

const getChatModel = () => {
  if (!chatModel) {
    chatModel = new ChatMistralAI({
      apiKey: process.env.MISTRAL_API_KEY,
      model: process.env.MISTRAL_MODEL || "mistral-small-latest",
      temperature: 0.1,
      maxTokens: 512,
    });
  }
  return chatModel;
};

const buildSystemPrompt = (relevantDocs) => {
  if (!relevantDocs.length) {
    return `You are a customer support assistant and programming expert. You can:
1. Answer questions based on documentation (when relevant docs are available)
2. Answer general questions and queries
3. Provide code snippets and programming examples
4. Help with debugging and technical problems

Be concise, helpful, and friendly. It's okay to provide code examples and help with programming tasks.

DOCUMENTATION:
No relevant documentation found for this query.`;
  }

  const docContext = relevantDocs
    .map((doc) => `## ${doc.title}\n${doc.content}`)
    .join("\n\n");

  return `You are a customer support assistant and programming expert. You can:
1. Answer documentation-based questions (use the DOCUMENTATION section below)
2. Answer general questions and queries
3. Provide code snippets and programming examples
4. Help with debugging and technical problems

GUIDELINES:
- If relevant documentation exists below, prioritize using it to answer the question.
- If the question is not covered in the documentation, you may use your general knowledge.
- Provide code examples and programming help when requested.
- Be concise, helpful, and friendly.

DOCUMENTATION:
${docContext}`;
};

const estimateTokens = (text) => Math.ceil(text.length / 4);

const generateReply = async (userMessage, chatHistory) => {
  try {
    const model = getChatModel();
    const relevantDocs = await findRelevantDocs(userMessage, 3, 0.45);
    const systemPrompt = buildSystemPrompt(relevantDocs);

    // Build messages array: system + history + current
    const messages = [new SystemMessage(systemPrompt)];
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === "user") {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === "assistant") {
        messages.push(new AIMessage(msg.content));
      }
    }
    messages.push(new HumanMessage(userMessage));

    const response = await model.invoke(messages);

    const reply = response.content;
    const tokensUsed =
      response.usage_metadata?.total_tokens ||
      response.response_metadata?.tokenUsage?.totalTokens ||
      estimateTokens(systemPrompt + userMessage + reply);

    return { reply, tokensUsed };
  } catch (error) {
    // Log error and return a safe message
    console.error("LLM Error:", error);
    return {
      reply: "Sorry, there was an error processing your request.",
      tokensUsed: 0,
    };
  }
};

module.exports = { generateReply };