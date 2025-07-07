// Get DOM elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Conversation history and user name
let conversation = [];
let userName = "";

// Ask for user's name at the start
function askName() {
  chatWindow.innerHTML = `<div class="bot-message">👋 Hello! What's your name?</div>`;
}

askName();

// System prompt for the chatbot
const systemPrompt = `You are a helpful AI assistant for L'Oréal. Only answer questions about L'Oréal products, beauty routines, and recommendations. If a question is not related to L'Oréal or beauty, politely reply: "I'm here to help with L'Oréal products, routines, and beauty advice. Please ask me something related!" Always remember the user's name and previous questions to keep the conversation natural.`;
conversation.push({ role: "system", content: systemPrompt });

// Function to add a message to the chat window
function addMessage(message, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "user" ? "user-message" : "bot-message";
  msgDiv.textContent = message;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Handle form submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = userInput.value.trim();
  if (!input) return;

  // If we don't have the user's name yet, treat the first input as their name
  if (!userName) {
    userName = input;
    addMessage(
      `Nice to meet you, ${userName}! How can I help you today?`,
      "bot"
    );
    conversation.push({ role: "user", content: `My name is ${userName}.` });
    userInput.value = "";
    return;
  }

  // Show user message
  addMessage(input, "user");
  conversation.push({ role: "user", content: input });
  userInput.value = "";

  // Show loading message
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "bot-message";
  loadingMsg.textContent = "Thinking...";
  chatWindow.appendChild(loadingMsg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Prepare request to Cloudflare Worker (which talks to OpenAI)
  try {
    const response = await fetch(
      "https://patient-base-cf2f.jfrederick2022.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: conversation,
          max_tokens: 300,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();
    loadingMsg.remove();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const botReply = data.choices[0].message.content.trim();
      addMessage(botReply, "bot");
      conversation.push({ role: "assistant", content: botReply });
    } else {
      addMessage("Sorry, I couldn't get a response. Please try again.", "bot");
    }
  } catch (error) {
    loadingMsg.remove();
    addMessage(
      "There was an error connecting to the AI. Please try again later.",
      "bot"
    );
  }
});
