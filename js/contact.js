// Contact page functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeContactForm();
    initializeLiveChat();
    initializeFormValidation();
});

function initializeContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleContactFormSubmission(this);
    });
    
    // Add real-time validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateContactField(this);
        });
        
        input.addEventListener('input', function() {
            clearContactFieldError(this);
        });
    });
    
    // Character counter for message textarea
    const messageTextarea = document.getElementById('message');
    if (messageTextarea) {
        addCharacterCounter(messageTextarea);
    }
}

function initializeFormValidation() {
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateContactEmail(this);
        });
    }
    
    // Phone validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            validateContactPhone(this);
        });
    }
}

function validateContactField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    
    // Clear previous errors
    clearContactFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showContactFieldError(field, 'This field is required');
        return false;
    }
    
    // Specific field validations
    switch (fieldName) {
        case 'email':
            return validateContactEmail(field);
        case 'phone':
            return validateContactPhone(field);
        case 'message':
            return validateMessage(field);
        default:
            return true;
    }
}

function validateContactEmail(field) {
    const email = field.value.trim();
    if (email && !BTechNotesHub.validateEmail(email)) {
        showContactFieldError(field, 'Please enter a valid email address');
        return false;
    }
    return true;
}

function validateContactPhone(field) {
    const phone = field.value.trim();
    if (phone && !BTechNotesHub.validatePhone(phone)) {
        showContactFieldError(field, 'Please enter a valid phone number');
        return false;
    }
    return true;
}

function validateMessage(field) {
    const message = field.value.trim();
    if (message && message.length < 10) {
        showContactFieldError(field, 'Message should be at least 10 characters long');
        return false;
    }
    if (message && message.length > 1000) {
        showContactFieldError(field, 'Message should not exceed 1000 characters');
        return false;
    }
    return true;
}

function showContactFieldError(field, message) {
    clearContactFieldError(field);
    
    field.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
    
    // Add error styles if not present
    if (!document.querySelector('#contact-error-styles')) {
        const styles = document.createElement('style');
        styles.id = 'contact-error-styles';
        styles.textContent = `
            .form-group input.error,
            .form-group select.error,
            .form-group textarea.error {
                border-color: #ef4444;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            }
            .field-error {
                color: #ef4444;
                font-size: 0.75rem;
                margin-top: 0.25rem;
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }
            .field-error::before {
                content: '⚠';
                font-size: 0.875rem;
            }
            .char-counter {
                font-size: 0.75rem;
                color: #64748b;
                text-align: right;
                margin-top: 0.25rem;
            }
            .char-counter.warning {
                color: #f59e0b;
            }
            .char-counter.error {
                color: #ef4444;
            }
        `;
        document.head.appendChild(styles);
    }
}

function clearContactFieldError(field) {
    field.classList.remove('error');
    
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function addCharacterCounter(textarea) {
    const maxLength = 1000;
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    
    function updateCounter() {
        const length = textarea.value.length;
        counter.textContent = `${length}/${maxLength} characters`;
        
        if (length > maxLength * 0.9) {
            counter.className = 'char-counter warning';
        } else if (length > maxLength) {
            counter.className = 'char-counter error';
        } else {
            counter.className = 'char-counter';
        }
    }
    
    textarea.addEventListener('input', updateCounter);
    textarea.parentNode.appendChild(counter);
    updateCounter();
}

function validateContactForm(form) {
    let isValid = true;
    
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        if (!validateContactField(input)) {
            isValid = false;
        }
    });
    
    // Check required checkboxes
    const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');
    requiredCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            showContactFieldError(checkbox, 'This field is required');
            isValid = false;
        }
    });
    
    return isValid;
}

async function handleContactFormSubmission(form) {
    // Validate form
    if (!validateContactForm(form)) {
        BTechNotesHub.showNotification('Please fix the errors in the form', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Add metadata
        data.submissionDate = new Date().toISOString();
        data.userAgent = navigator.userAgent;
        data.referrer = document.referrer;
        data.ticketId = generateTicketId();
        
        // Simulate API call
        await simulateContactSubmission(data);
        
        // Show success message
        BTechNotesHub.showNotification('Your message has been sent! We\'ll get back to you soon.', 'success');
        
        // Reset form
        form.reset();
        clearAllContactFieldErrors(form);
        
        // Save to local storage for tracking
        saveContactToLocalStorage(data);
        
        // Show confirmation modal
        setTimeout(() => {
            showContactConfirmation(data);
        }, 1000);
        
    } catch (error) {
        console.error('Contact submission error:', error);
        BTechNotesHub.showNotification('Failed to send message. Please try again.', 'error');
    } finally {
        // Restore button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function simulateContactSubmission(data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate random success/failure (95% success rate)
    if (Math.random() < 0.05) {
        throw new Error('Submission failed');
    }
    
    return { success: true, ticketId: data.ticketId };
}

function generateTicketId() {
    return 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function clearAllContactFieldErrors(form) {
    const errorDivs = form.querySelectorAll('.field-error');
    errorDivs.forEach(div => div.remove());
    
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
}

function saveContactToLocalStorage(data) {
    const contacts = BTechNotesHub.getFromLocalStorage('contacts') || [];
    contacts.push(data);
    BTechNotesHub.saveToLocalStorage('contacts', contacts);
}

function showContactConfirmation(data) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Message Sent Successfully!</h3>
            </div>
            <div class="modal-body">
                <div class="confirmation-content">
                    <div class="confirmation-icon">
                        <i class="fas fa-paper-plane"></i>
                    </div>
                    <h4>Thank you for contacting us!</h4>
                    <p>Your message has been received and assigned ticket ID: <strong>${data.ticketId}</strong></p>
                    
                    <div class="message-summary">
                        <h5>Message Summary:</h5>
                        <div class="summary-item">
                            <strong>Subject:</strong> ${data.subject}
                        </div>
                        <div class="summary-item">
                            <strong>From:</strong> ${data['first-name']} ${data['last-name']}
                        </div>
                        <div class="summary-item">
                            <strong>Email:</strong> ${data.email}
                        </div>
                    </div>
                    
                    <div class="response-info">
                        <h5>What's Next?</h5>
                        <ul>
                            <li>We typically respond within 24 hours</li>
                            <li>You'll receive a confirmation email shortly</li>
                            <li>For urgent matters, contact us via WhatsApp</li>
                            <li>Keep your ticket ID for reference</li>
                        </ul>
                    </div>
                    
                    <div class="alternative-contact">
                        <h5>Need Immediate Help?</h5>
                        <div class="contact-options">
                            <a href="https://wa.me/919876543210" class="contact-option" target="_blank">
                                <i class="fab fa-whatsapp"></i>
                                WhatsApp Support
                            </a>
                            <a href="mailto:support@btechnoteshub.com" class="contact-option">
                                <i class="fas fa-envelope"></i>
                                Email Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove(); document.body.style.overflow = '';">
                    <i class="fas fa-check"></i>
                    Got It
                </button>
                <a href="index.html" class="btn btn-secondary">
                    <i class="fas fa-home"></i>
                    Back to Home
                </a>
            </div>
        </div>
    `;
    
    // Add confirmation styles
    if (!document.querySelector('#confirmation-styles')) {
        const styles = document.createElement('style');
        styles.id = 'confirmation-styles';
        styles.textContent = `
            .confirmation-content {
                text-align: center;
                padding: 1rem 0;
            }
            .confirmation-icon {
                font-size: 4rem;
                color: #3b82f6;
                margin-bottom: 1rem;
            }
            .message-summary,
            .response-info,
            .alternative-contact {
                text-align: left;
                margin: 1.5rem 0;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 8px;
            }
            .summary-item {
                margin-bottom: 0.5rem;
                color: #64748b;
            }
            .response-info ul {
                margin: 0.5rem 0;
                padding-left: 1.5rem;
            }
            .response-info li {
                margin-bottom: 0.5rem;
                color: #64748b;
            }
            .contact-options {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            .contact-option {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                color: #3b82f6;
                text-decoration: none;
                transition: all 0.2s ease;
                flex: 1;
                justify-content: center;
            }
            .contact-option:hover {
                background: #3b82f6;
                color: white;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function initializeLiveChat() {
    const startChatBtn = document.getElementById('start-chat');
    if (!startChatBtn) return;
    
    startChatBtn.addEventListener('click', function() {
        showLiveChatModal();
    });
}

function showLiveChatModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Live Chat Support</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove(); document.body.style.overflow = '';">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="chat-info">
                    <div class="chat-status">
                        <div class="status-indicator online"></div>
                        <span>Support team is online</span>
                    </div>
                    
                    <div class="chat-hours">
                        <h5>Chat Hours:</h5>
                        <p>Monday - Friday: 9:00 AM - 6:00 PM<br>
                        Saturday: 10:00 AM - 4:00 PM<br>
                        Sunday: Closed</p>
                    </div>
                    
                    <div class="chat-features">
                        <h5>How we can help:</h5>
                        <ul>
                            <li>Technical support and troubleshooting</li>
                            <li>Account and download issues</li>
                            <li>Content questions and requests</li>
                            <li>General inquiries</li>
                        </ul>
                    </div>
                    
                    <div class="chat-alternatives">
                        <p>Chat not available? Try these alternatives:</p>
                        <div class="alternative-buttons">
                            <a href="https://wa.me/919876543210" class="btn btn-secondary" target="_blank">
                                <i class="fab fa-whatsapp"></i>
                                WhatsApp
                            </a>
                            <a href="mailto:support@btechnoteshub.com" class="btn btn-secondary">
                                <i class="fas fa-envelope"></i>
                                Email
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="startLiveChat()">
                    <i class="fas fa-comments"></i>
                    Start Chat
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove(); document.body.style.overflow = '';">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    // Add chat styles
    if (!document.querySelector('#chat-styles')) {
        const styles = document.createElement('style');
        styles.id = 'chat-styles';
        styles.textContent = `
            .chat-info {
                padding: 1rem 0;
            }
            .chat-status {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
                padding: 1rem;
                background: #f0fdf4;
                border-radius: 8px;
                border-left: 4px solid #10b981;
            }
            .status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #10b981;
                animation: pulse 2s infinite;
            }
            .chat-hours,
            .chat-features,
            .chat-alternatives {
                margin: 1.5rem 0;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 8px;
            }
            .chat-features ul {
                margin: 0.5rem 0;
                padding-left: 1.5rem;
            }
            .chat-features li {
                margin-bottom: 0.5rem;
                color: #64748b;
            }
            .alternative-buttons {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function startLiveChat() {
    // In a real application, this would integrate with a live chat service
    BTechNotesHub.showNotification('Live chat feature coming soon! Please use WhatsApp or email for now.', 'info');
    
    // Close modal
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
    
    // Redirect to WhatsApp after a delay
    setTimeout(() => {
        window.open('https://wa.me/919876543210', '_blank');
    }, 2000);
}

// Export for debugging
window.ContactPage = {
    validateContactForm,
    handleContactFormSubmission,
    showLiveChatModal,
    startLiveChat
};

