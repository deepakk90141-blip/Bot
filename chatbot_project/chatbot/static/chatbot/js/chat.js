document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chatForm');
    const chatMessages = document.getElementById('chatMessages');
    const userMessageInput = document.getElementById('userMessage');
    const typingIndicator = document.getElementById('typingIndicator');
    
    
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');


    function markdownToHtml(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // Handle code blocks with triple backticks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const safeCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<pre><code class="language-${lang}">${safeCode}</code></pre>`;
    });

    // Convert bold text: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet points
    html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

    // Numbered lists
    html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li>$1</li>');
if (html.match(/^\s*\d+\.\s+/gm)) {
    html = html.replace(/<li>(.*?)<\/li>/g, '<li>$1</li>');
    html = `<ol>${html}</ol>`;
}


    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
}


    
    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        // Show the message content with markdown formatting
        if (isUser) {
            messageDiv.textContent = message;
        } else {
            // For bot messages, convert markdown to HTML
            messageDiv.innerHTML = markdownToHtml(message);
        }
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        const now = new Date();
        timestamp.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        messageDiv.appendChild(timestamp);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
function typeTextWithMarkdown(text, container, speed = 30) {
    let i = 0;
    let plainText = text;

    function typeChar() {
        if (i <= plainText.length) {
            // Update text with markdown
            container.innerHTML = markdownToHtml(plainText.substring(0, i));
            i++;

            // 💬 Scroll chat window smoothly with each character
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });

            setTimeout(typeChar, speed);
        } else {
            // Add timestamp after typing is done
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            const now = new Date();
            timestamp.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            container.appendChild(timestamp);

            // Final scroll after typing is complete
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    typeChar();
}


    // Handle form submission with AJAX
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userMessage = userMessageInput.value.trim();
        if (!userMessage) return;
        
        // Add user message to chat
        addMessage(userMessage, true);
        userMessageInput.value = '';
        
        // Show typing indicator
        typingIndicator.style.display = 'block';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Send request to server
        const formData = new FormData();
        formData.append('user_message', userMessage);
        formData.append('csrfmiddlewaretoken', csrftoken);
        
        console.log('Sending message:', userMessage);
        console.log('Form data:', Object.fromEntries(formData.entries()));
        
        // Use fetch API instead of XMLHttpRequest
        console.log('Sending request to:', '/chat/ajax/');
        // Try with a different URL format
        fetch('/chat/ajax', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRFToken': csrftoken
            }
        })
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            // Hide typing indicator
            typingIndicator.style.display = 'none';
            
            // Create a new div to hold the bot's animated message
           const botMessageDiv = document.createElement('div');
           botMessageDiv.className = 'message bot-message';
           chatMessages.appendChild(botMessageDiv);

// Start typing the bot response character by character
typeTextWithMarkdown(data.bot_response, botMessageDiv);
hljs.highlightAll();
addCopyButtons(); 

        })
        .catch(error => {
            console.error('Error:', error);
            console.error('Error details:', error.message);
            typingIndicator.style.display = 'none';
            addMessage('Sorry, there was an error processing your request: ' + error.message);
        });
    });

    // Focus on input field when page loads
    userMessageInput.focus();

    // Add timestamp to initial message and animate
    setTimeout(() => {
        const initialMessage = document.getElementById('initialMessage');
        if (initialMessage) {
            // Add timestamp to the initial message
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            const now = new Date();
            timestamp.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            initialMessage.appendChild(timestamp);
            
            // Add animation
            initialMessage.style.opacity = '0';
            initialMessage.style.transform = 'translateY(20px)';
            initialMessage.style.transition = 'opacity 0.5s, transform 0.5s';
            
            setTimeout(() => {
                initialMessage.style.opacity = '1';
                initialMessage.style.transform = 'translateY(0)';
            }, 100);
        }
    }, 300);
});

function addCopyButtons() {
    document.querySelectorAll('pre code').forEach((block) => {
        if (block.parentElement.querySelector('.copy-btn')) return;

        const button = document.createElement('button');
        button.textContent = '📋 Copy';
        button.className = 'copy-btn';

        button.onclick = () => {
            navigator.clipboard.writeText(block.textContent);
            button.textContent = '✅ Copied!';
            setTimeout(() => button.textContent = '📋 Copy', 1500);
        };

        block.parentElement.style.position = 'relative';
        block.parentElement.appendChild(button);
    });
}
