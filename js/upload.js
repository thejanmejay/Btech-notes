// Upload Guidelines page functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeUploadForm();
    initializeFormValidation();
    initializeProgressTracking();
});

function initializeUploadForm() {
    const form = document.getElementById('submission-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmission(this);
    });
    
    // Add real-time validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function initializeFormValidation() {
    // Drive link validation
    const driveLinkInput = document.getElementById('drive-link');
    if (driveLinkInput) {
        driveLinkInput.addEventListener('input', function() {
            validateDriveLink(this);
        });
    }
    
    // Email validation
    const emailInput = document.getElementById('contributor-email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateEmail(this);
        });
    }
    
    // File size validation
    const fileSizeInput = document.getElementById('file-size');
    if (fileSizeInput) {
        fileSizeInput.addEventListener('input', function() {
            validateFileSize(this);
        });
    }
}

function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Specific field validations
    switch (fieldName) {
        case 'contributor-email':
            return validateEmail(field);
        case 'drive-link':
            return validateDriveLink(field);
        case 'file-size':
            return validateFileSize(field);
        default:
            return true;
    }
}

function validateEmail(field) {
    const email = field.value.trim();
    if (email && !BTechNotesHub.validateEmail(email)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    return true;
}

function validateDriveLink(field) {
    const link = field.value.trim();
    if (link) {
        const drivePattern = /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)/;
        if (!drivePattern.test(link)) {
            showFieldError(field, 'Please enter a valid Google Drive link');
            return false;
        }
    }
    return true;
}

function validateFileSize(field) {
    const size = field.value.trim();
    if (size) {
        const sizePattern = /^\d+(\.\d+)?\s*(KB|MB|GB)$/i;
        if (!sizePattern.test(size)) {
            showFieldError(field, 'Please enter size in format like "2.5MB"');
            return false;
        }
        
        // Check if size is reasonable (under 50MB)
        const match = size.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            
            let sizeInMB = value;
            if (unit === 'KB') sizeInMB = value / 1024;
            if (unit === 'GB') sizeInMB = value * 1024;
            
            if (sizeInMB > 50) {
                showFieldError(field, 'File size should be under 50MB');
                return false;
            }
        }
    }
    return true;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
    
    // Add error styles if not present
    if (!document.querySelector('#field-error-styles')) {
        const styles = document.createElement('style');
        styles.id = 'field-error-styles';
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
        `;
        document.head.appendChild(styles);
    }
}

function clearFieldError(field) {
    field.classList.remove('error');
    
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function validateForm(form) {
    let isValid = true;
    
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    // Check checkboxes
    const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');
    requiredCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            showFieldError(checkbox, 'This field is required');
            isValid = false;
        }
    });
    
    return isValid;
}

async function handleFormSubmission(form) {
    // Validate form
    if (!validateForm(form)) {
        BTechNotesHub.showNotification('Please fix the errors in the form', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    try {
        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Add timestamp
        data.submissionDate = new Date().toISOString();
        data.status = 'pending';
        
        // Simulate API call (in real app, this would be an actual API call)
        await simulateSubmission(data);
        
        // Show success message
        BTechNotesHub.showNotification('Your submission has been received! We\'ll review it within 24-48 hours.', 'success');
        
        // Reset form
        form.reset();
        clearAllFieldErrors(form);
        
        // Save to local storage for tracking
        saveSubmissionToLocalStorage(data);
        
        // Redirect to thank you section
        setTimeout(() => {
            showThankYouMessage(data);
        }, 2000);
        
    } catch (error) {
        console.error('Submission error:', error);
        BTechNotesHub.showNotification('Failed to submit. Please try again.', 'error');
    } finally {
        // Restore button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function simulateSubmission(data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random success/failure (90% success rate)
    if (Math.random() < 0.1) {
        throw new Error('Submission failed');
    }
    
    return { success: true, id: generateSubmissionId() };
}

function generateSubmissionId() {
    return 'SUB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function clearAllFieldErrors(form) {
    const errorDivs = form.querySelectorAll('.field-error');
    errorDivs.forEach(div => div.remove());
    
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
}

function saveSubmissionToLocalStorage(data) {
    const submissions = BTechNotesHub.getFromLocalStorage('submissions') || [];
    submissions.push(data);
    BTechNotesHub.saveToLocalStorage('submissions', submissions);
}

function showThankYouMessage(data) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Submission Received!</h3>
            </div>
            <div class="modal-body">
                <div class="thank-you-content">
                    <div class="thank-you-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h4>Thank you for your contribution!</h4>
                    <p>Your note submission for <strong>${data['note-subject']}</strong> has been received and will be reviewed by our team.</p>
                    <div class="submission-details">
                        <h5>Submission Details:</h5>
                        <ul>
                            <li><strong>Title:</strong> ${data['note-title']}</li>
                            <li><strong>Subject:</strong> ${data['note-subject']}</li>
                            <li><strong>Branch:</strong> ${data['note-branch']}</li>
                            <li><strong>Year:</strong> ${data['note-year']}</li>
                            <li><strong>Semester:</strong> ${data['note-semester']}</li>
                        </ul>
                    </div>
                    <div class="next-steps">
                        <h5>What happens next?</h5>
                        <ol>
                            <li>Our team will review your submission within 24-48 hours</li>
                            <li>We'll verify the content quality and Google Drive link</li>
                            <li>You'll receive an email notification once approved</li>
                            <li>Your notes will be live on the platform for students to access</li>
                        </ol>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-home"></i>
                    Back to Home
                </button>
                <a href="notes.html" class="btn btn-secondary">
                    <i class="fas fa-book"></i>
                    Browse Notes
                </a>
            </div>
        </div>
    `;
    
    // Add thank you styles
    if (!document.querySelector('#thank-you-styles')) {
        const styles = document.createElement('style');
        styles.id = 'thank-you-styles';
        styles.textContent = `
            .thank-you-content {
                text-align: center;
                padding: 1rem 0;
            }
            .thank-you-icon {
                font-size: 4rem;
                color: #10b981;
                margin-bottom: 1rem;
            }
            .submission-details,
            .next-steps {
                text-align: left;
                margin: 1.5rem 0;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 8px;
            }
            .submission-details ul,
            .next-steps ol {
                margin: 0.5rem 0;
                padding-left: 1.5rem;
            }
            .submission-details li,
            .next-steps li {
                margin-bottom: 0.5rem;
                color: #64748b;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Auto-close after 30 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }, 30000);
}

function initializeProgressTracking() {
    // Show user's previous submissions if any
    const submissions = BTechNotesHub.getFromLocalStorage('submissions') || [];
    if (submissions.length > 0) {
        showSubmissionHistory(submissions);
    }
}

function showSubmissionHistory(submissions) {
    const historySection = document.createElement('div');
    historySection.className = 'submission-history';
    historySection.innerHTML = `
        <h3>Your Previous Submissions</h3>
        <div class="submissions-list">
            ${submissions.map(submission => `
                <div class="submission-item">
                    <div class="submission-info">
                        <h4>${submission['note-title']}</h4>
                        <p>${submission['note-subject']} - ${submission['note-branch']}</p>
                        <span class="submission-date">${BTechNotesHub.formatDate(submission.submissionDate)}</span>
                    </div>
                    <div class="submission-status">
                        <span class="status-badge status-${submission.status}">${submission.status}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Add history styles
    if (!document.querySelector('#history-styles')) {
        const styles = document.createElement('style');
        styles.id = 'history-styles';
        styles.textContent = `
            .submission-history {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                margin: 2rem 0;
            }
            .submissions-list {
                display: grid;
                gap: 1rem;
                margin-top: 1rem;
            }
            .submission-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 8px;
                border-left: 4px solid #3b82f6;
            }
            .submission-info h4 {
                margin: 0 0 0.25rem 0;
                color: #1e293b;
            }
            .submission-info p {
                margin: 0 0 0.25rem 0;
                color: #64748b;
                font-size: 0.875rem;
            }
            .submission-date {
                font-size: 0.75rem;
                color: #94a3b8;
            }
            .status-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
            }
            .status-pending {
                background: #fef3c7;
                color: #92400e;
            }
            .status-approved {
                background: #d1fae5;
                color: #065f46;
            }
            .status-rejected {
                background: #fee2e2;
                color: #991b1b;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Insert before the submission form
    const formSection = document.querySelector('.submission-section');
    if (formSection) {
        formSection.parentNode.insertBefore(historySection, formSection);
    }
}

// Export for debugging
window.UploadPage = {
    validateForm,
    handleFormSubmission,
    saveSubmissionToLocalStorage
};

