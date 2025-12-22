< script >
    // ==================== CONFIGURATION ====================
    // Replace these with your actual EmailJS credentials
    const EMAILJS_CONFIG = {
        PUBLIC_KEY: "PwaL1MCq-UPUUF1xM",
        SERVICE_ID: "service_jk670lo",
        TEMPLATE_ID: "template_p503glc"
    };

// Validation rules
const VALIDATION_RULES = {
    name: {
        minLength: 2,
        maxLength: 100,
        regex: /^[a-zA-ZÀ-ÿ\s'-]+$/,
        trim: true
    },
    email: {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxLength: 100
    },
    message: {
        minLength: 10,
        maxLength: 2000,
        trim: true
    }
};

// Error messages in both languages
const ERROR_MESSAGES = {
    en: {
        name: {
            required: "Please enter your name",
            minLength: "Name must be at least 2 characters",
            maxLength: "Name cannot exceed 100 characters",
            invalid: "Please use only letters, spaces, hyphens, and apostrophes"
        },
        email: {
            required: "Please enter your email",
            invalid: "Please enter a valid email address",
            maxLength: "Email cannot exceed 100 characters"
        },
        subject: {
            required: "Please select a subject"
        },
        message: {
            required: "Please enter your message",
            minLength: "Message must be at least 10 characters",
            maxLength: "Message cannot exceed 2000 characters"
        },
        form: {
            genericError: "An error occurred. Please try again or contact us directly.",
            networkError: "Network error. Please check your connection and try again.",
            emailSuccess: "Message sent successfully! We'll contact you soon."
        }
    },
    pt: {
        name: {
            required: "Por favor, insira seu nome",
            minLength: "O nome deve ter pelo menos 2 caracteres",
            maxLength: "O nome não pode exceder 100 caracteres",
            invalid: "Use apenas letras, espaços, hífens e apóstrofos"
        },
        email: {
            required: "Por favor, insira seu e-mail",
            invalid: "Por favor, insira um endereço de e-mail válido",
            maxLength: "O e-mail não pode exceder 100 caracteres"
        },
        subject: {
            required: "Por favor, selecione um assunto"
        },
        message: {
            required: "Por favor, insira sua mensagem",
            minLength: "A mensagem deve ter pelo menos 10 caracteres",
            maxLength: "A mensagem não pode exceder 2000 caracteres"
        },
        form: {
            genericError: "Ocorreu um erro. Tente novamente ou entre em contato diretamente.",
            networkError: "Erro de conexão. Verifique sua internet e tente novamente.",
            emailSuccess: "Mensagem enviada com sucesso! Entraremos em contato em breve."
        }
    }
};

// ==================== STATE MANAGEMENT ====================
const AppState = {
    currentLanguage: 'en',
    isSubmitting: false,
    formData: {},
    emailServiceReady: false
};

// ==================== UTILITY FUNCTIONS ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => toast.remove());

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;

    // Add styles
    const toastStyles = `
            <style>
                .toast-message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 300px;
                    max-width: 400px;
                    z-index: 9999;
                    animation: slideInRight 0.3s ease-out;
                    border-left: 4px solid;
                }
                .toast-success {
                    border-left-color: var(--success);
                }
                .toast-error {
                    border-left-color: var(--accent);
                }
                .toast-info {
                    border-left-color: var(--secondary);
                }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .toast-content i {
                    font-size: 1.2rem;
                }
                .toast-success .toast-content i {
                    color: var(--success);
                }
                .toast-error .toast-content i {
                    color: var(--accent);
                }
                .toast-close {
                    background: none;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    padding: 0;
                    font-size: 0.9rem;
                    transition: color 0.3s;
                }
                .toast-close:hover {
                    color: var(--primary);
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            </style>
        `;

    // Add styles if not already present
    if (!document.getElementById('toast-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'toast-styles';
        styleSheet.textContent = toastStyles;
        document.head.appendChild(styleSheet);
    }

    // Add to DOM
    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);

    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    });
}

// ==================== FORM VALIDATION ====================
class FormValidator {
    constructor() {
        this.errors = new Map();
    }

    validateField(fieldId, value) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);

        // Clear previous error
        this.errors.delete(fieldId);
        if (errorElement) errorElement.textContent = '';
        if (field) field.classList.remove('error');

        // Trim value if needed
        if (VALIDATION_RULES[fieldId] ? .trim) {
            value = value.trim();
        }

        // Required check
        if (!value || value === '') {
            this.errors.set(fieldId, ERROR_MESSAGES[AppState.currentLanguage][fieldId].required);
            return false;
        }

        // Field-specific validation
        switch (fieldId) {
            case 'name':
                if (value.length < VALIDATION_RULES.name.minLength) {
                    this.errors.set(fieldId, ERROR_MESSAGES[AppState.currentLanguage].name.minLength);
                    return false;
                }
                if (value.length > VALIDATION_RULES.name.maxLength) {
                    this.errors.set(fieldId, ERROR_MESSAGES[AppState.currentLanguage].name.maxLength);
                    return false;
                }
                if (!VALIDATION_RULES.name.regex.test(value)) {
                    this.errors.set(fieldId, ERROR_MESSAGES[AppState.currentLanguage].name.invalid);
                    return false;
                }
                break;

            case 'email':
                if (value.length > VALIDATION_RULES.email.maxLength) {
                    this.errors.set(fieldId, ERROR_MESSAGES[AppState.currentLanguage].email.maxLength);
                    return false;
                }
                if (!VALIDATION_RULES.email.regex.test(value)) {
                    this.errors.set(fieldId, ERROR_MESSAGES[AppState.currentLanguage].email.invalid);
                    return false;
                }
                break;

            case 'message':
                if (value.length < VALIDATION_RULES.message.minLength) {
                    this.errors.set(fieldId, ERROR_MESSAGES[AppState.currentLanguage].message.minLength);
                    return false;
                }
                if (value.length > VALIDATION_RULES.message.maxLength) {
                    this.errors.set(fieldId, ERROR_MESSAGES[AppState.currentLanguage].message.maxLength);
                    return false;
                }
                break;
        }

        return true;
    }

    validateForm(formData) {
        this.errors.clear();

        const fields = ['name', 'email', 'subject', 'message'];
        let isValid = true;

        fields.forEach(fieldId => {
            const value = formData[fieldId] || '';
            if (!this.validateField(fieldId, value)) {
                isValid = false;
            }
        });

        return isValid;
    }

    displayErrors() {
        this.errors.forEach((message, fieldId) => {
            const errorElement = document.getElementById(`${fieldId}Error`);
            const field = document.getElementById(fieldId);

            if (errorElement) {
                errorElement.textContent = message;
            }
            if (field) {
                field.classList.add('error');
                // Scroll to first error
                if (this.errors.size === 1) {
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }

    clearErrors() {
        this.errors.clear();
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    }
}

// ==================== EMAIL SERVICE ====================
class EmailService {
    constructor() {
        this.initialized = false;
        this.initialize();
    }

    async initialize() {
        try {
            if (!EMAILJS_CONFIG.PUBLIC_KEY || EMAILJS_CONFIG.PUBLIC_KEY === "YOUR_PUBLIC_KEY_HERE") {
                console.warn('EmailJS not configured. Using demo mode.');
                AppState.emailServiceReady = false;
                return;
            }

            await emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
            this.initialized = true;
            AppState.emailServiceReady = true;
            console.log('EmailJS initialized successfully');
        } catch (error) {
            console.error('EmailJS initialization failed:', error);
            AppState.emailServiceReady = false;
        }
    }

    async sendEmail(formData) {
        if (!this.initialized) {
            throw new Error('Email service not initialized');
        }

        const templateParams = {
            from_name: formData.name,
            from_email: formData.email,
            subject: this.getSubjectText(formData.subject),
            message: formData.message,
            date: new Date().toLocaleString(),
            language: AppState.currentLanguage,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await emailjs.send(
                EMAILJS_CONFIG.SERVICE_ID,
                EMAILJS_CONFIG.TEMPLATE_ID,
                templateParams
            );

            return {
                success: true,
                data: response,
                message: 'Email sent successfully'
            };
        } catch (error) {
            console.error('Email sending failed:', error);

            // Provide user-friendly error messages
            let userMessage = ERROR_MESSAGES[AppState.currentLanguage].form.genericError;

            if (error.text ? .includes('Network Error') || !navigator.onLine) {
                userMessage = ERROR_MESSAGES[AppState.currentLanguage].form.networkError;
            }

            return {
                success: false,
                error: error,
                message: userMessage
            };
        }
    }

    getSubjectText(subjectValue) {
        const subjects = {
            'trial-lesson': {
                en: 'Trial Lesson Inquiry',
                pt: 'Consulta sobre Aula Experimental'
            },
            'general-inquiry': {
                en: 'General Inquiry',
                pt: 'Consulta Geral'
            },
            'corporate-training': {
                en: 'Corporate Training Inquiry',
                pt: 'Consulta sobre Treinamento Corporativo'
            },
            'other': {
                en: 'Other Inquiry',
                pt: 'Outra Consulta'
            }
        };

        return subjects[subjectValue] ? .[AppState.currentLanguage] || subjectValue;
    }
}

// ==================== FORM HANDLER ====================
class FormHandler {
    constructor() {
        this.validator = new FormValidator();
        this.emailService = new EmailService();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCharacterCounter();
        this.setupRealTimeValidation();
    }

    setupEventListeners() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Prevent multiple submissions
        form.addEventListener('submit', () => {
            if (AppState.isSubmitting) {
                e.preventDefault();
                return;
            }
        });
    }

    setupCharacterCounter() {
        const messageField = document.getElementById('message');
        const counter = document.getElementById('messageCounter');

        if (!messageField || !counter) return;

        const updateCounter = () => {
            const length = messageField.value.length;
            counter.textContent = `${length}/${VALIDATION_RULES.message.maxLength}`;

            // Update color based on length
            counter.className = 'char-counter';
            if (length > 1800 && length <= 1900) {
                counter.classList.add('warning');
            } else if (length > 1900) {
                counter.classList.add('error');
            }
        };

        messageField.addEventListener('input', updateCounter);
        messageField.addEventListener('blur', updateCounter);

        // Initial update
        updateCounter();
    }

    setupRealTimeValidation() {
        const fields = ['name', 'email', 'subject', 'message'];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) return;

            const debouncedValidation = debounce(() => {
                const value = field.value;
                this.validator.validateField(fieldId, value);
            }, 300);

            field.addEventListener('input', debouncedValidation);
            field.addEventListener('blur', () => {
                this.validator.validateField(fieldId, field.value);
            });

            // Special handling for select field
            if (fieldId === 'subject') {
                field.addEventListener('change', () => {
                    this.validator.validateField(fieldId, field.value);
                });
            }
        });
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (AppState.isSubmitting) {
            showToast(
                AppState.currentLanguage === 'en' ?
                'Please wait...' :
                'Por favor, aguarde...',
                'info'
            );
            return;
        }

        // Get form data
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value.trim()
        };

        // Validate form
        this.validator.clearErrors();
        if (!this.validator.validateForm(formData)) {
            this.validator.displayErrors();
            showToast(
                ERROR_MESSAGES[AppState.currentLanguage].form.validationError ||
                (AppState.currentLanguage === 'en' ?
                    'Please fix the errors above' :
                    'Corrija os erros acima'),
                'error'
            );
            return;
        }

        // Set submitting state
        this.setSubmittingState(true);
        AppState.formData = formData;

        try {
            // Send email
            const result = await this.emailService.sendEmail(formData);

            if (result.success) {
                // Show success message
                showToast(ERROR_MESSAGES[AppState.currentLanguage].form.emailSuccess, 'success');

                // Reset form
                this.resetForm();

                // Log success (in production, you might want to send this to analytics)
                console.log('Form submitted successfully:', {
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    timestamp: new Date().toISOString()
                });
            } else {
                // Show error message
                showToast(result.message || ERROR_MESSAGES[AppState.currentLanguage].form.genericError, 'error');

                // If it's a configuration error, show helpful message
                if (result.error ? .text ? .includes('public key')) {
                    console.error('EmailJS configuration error. Please check your credentials.');
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showToast(ERROR_MESSAGES[AppState.currentLanguage].form.genericError, 'error');
        } finally {
            this.setSubmittingState(false);
        }
    }

    setSubmittingState(isSubmitting) {
        AppState.isSubmitting = isSubmitting;
        const submitButton = document.querySelector('#contactForm button[type="submit"]');
        const submitText = document.getElementById('submitText');
        const submitLoading = document.getElementById('submitLoading');

        if (submitButton && submitText && submitLoading) {
            submitButton.disabled = isSubmitting;
            if (isSubmitting) {
                submitText.style.display = 'none';
                submitLoading.style.display = 'inline';
            } else {
                submitText.style.display = 'inline';
                submitLoading.style.display = 'none';
            }
        }
    }

    resetForm() {
        const form = document.getElementById('contactForm');
        if (form) form.reset();

        // Reset character counter
        const counter = document.getElementById('messageCounter');
        if (counter) {
            counter.textContent = `0/${VALIDATION_RULES.message.maxLength}`;
            counter.className = 'char-counter';
        }

        // Clear all errors
        this.validator.clearErrors();

        // Clear form data
        AppState.formData = {};
    }
}

// ==================== LANGUAGE MANAGEMENT ====================
class LanguageManager {
    constructor() {
        this.currentLang = 'en';
    }

    initialize() {
        this.loadLanguagePreference();
        this.setupLanguageSwitcher();
        this.updatePageContent();
    }

    loadLanguagePreference() {
        const savedLang = localStorage.getItem('preferredLang');
        const browserLang = navigator.language.startsWith('pt') ? 'pt' : 'en';
        this.currentLang = savedLang || browserLang;
        AppState.currentLanguage = this.currentLang;
    }

    setupLanguageSwitcher() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                this.switchLanguage(lang);
            });
        });
    }

    switchLanguage(lang) {
        if (this.currentLang === lang) return;

        this.currentLang = lang;
        AppState.currentLanguage = lang;

        // Update UI
        this.updateLanguageButtons();
        this.updateContentVisibility();
        this.updateDynamicContent();

        // Save preference
        localStorage.setItem('preferredLang', lang);

        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }

    updateLanguageButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.dataset.lang === this.currentLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateContentVisibility() {
        document.querySelectorAll('.lang-content').forEach(content => {
            if (content.dataset.lang === this.currentLang) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    updateDynamicContent() {
        // Update elements with data attributes
        document.querySelectorAll('[data-en], [data-pt]').forEach(element => {
            const text = element.dataset[this.currentLang];
            if (text) {
                element.textContent = text;
            }
        });

        // Update select options
        document.querySelectorAll('select option').forEach(option => {
            const enText = option.querySelector('.lang-content[data-lang="en"]');
            const ptText = option.querySelector('.lang-content[data-lang="pt"]');

            if (enText && ptText) {
                option.textContent = this.currentLang === 'en' ? enText.textContent : ptText.textContent;
            }
        });

        // Update form placeholders if they exist
        const placeholders = {
            name: { en: "Enter your full name", pt: "Digite seu nome completo" },
            email: { en: "Enter your email address", pt: "Digite seu endereço de e-mail" },
            message: { en: "Type your message here...", pt: "Digite sua mensagem aqui..." }
        };

        Object.keys(placeholders).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.placeholder = placeholders[fieldId][this.currentLang];
            }
        });
    }
}

// ==================== APPLICATION INITIALIZATION ====================
class Application {
    constructor() {
        this.languageManager = new LanguageManager();
        this.formHandler = null;
    }

    async initialize() {
        // Initialize core components
        this.languageManager.initialize();

        // Setup navigation
        this.setupNavigation();

        // Initialize form handler
        this.formHandler = new FormHandler();

        // Setup modal
        this.setupModal();

        // Setup smooth scrolling
        this.setupSmoothScrolling();

        // Setup scroll spy
        this.setupScrollSpy();

        // Handle image errors
        this.setupImageErrorHandling();

        // Add CSS for additional styles
        this.addAdditionalStyles();

        console.log('Application initialized successfully');
    }

    setupNavigation() {
        // Mobile menu toggle
        const mobileToggle = document.querySelector('.mobile-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                mobileToggle.querySelector('i').classList.toggle('fa-bars');
                mobileToggle.querySelector('i').classList.toggle('fa-times');
            });

            // Close menu when clicking links
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    mobileToggle.querySelector('i').classList.remove('fa-times');
                    mobileToggle.querySelector('i').classList.add('fa-bars');
                });
            });
        }
    }

    setupModal() {
        const viewMoreBtn = document.getElementById('viewMoreBtn');
        const experienceModal = document.getElementById('experienceModal');
        const closeModal = document.querySelector('.close-modal');

        if (viewMoreBtn && experienceModal && closeModal) {
            viewMoreBtn.addEventListener('click', () => {
                experienceModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            });

            closeModal.addEventListener('click', () => {
                experienceModal.style.display = 'none';
                document.body.style.overflow = '';
            });

            // Close on outside click
            window.addEventListener('click', (e) => {
                if (e.target === experienceModal) {
                    experienceModal.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && experienceModal.style.display === 'block') {
                    experienceModal.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
        }
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');

                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerOffset = 80;
                    const elementPosition = targetElement.offsetTop;
                    const offsetPosition = elementPosition - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

        const observerOptions = {
            root: null,
            rootMargin: '-100px 0px -25% 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    setupImageErrorHandling() {
        const teacherPhoto = document.getElementById('teacherPhoto');
        if (teacherPhoto) {
            teacherPhoto.addEventListener('error', function() {
                console.log('Profile image not found, using placeholder');
                // Fallback is already in the HTML
            });
        }
    }

    addAdditionalStyles() {
        const additionalStyles = `
                /* Loading animation enhancement */
                .loading-spinner {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255,255,255,.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s ease-in-out infinite;
                    margin-right: 10px;
                    vertical-align: middle;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Form validation enhancements */
                .form-control:focus {
                    outline: none;
                    border-color: var(--secondary);
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
                }
                
                .form-control.error:focus {
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2);
                }
                
                /* Character counter styles */
                .char-counter {
                    text-align: right;
                    font-size: 0.85rem;
                    color: #666;
                    margin-top: 5px;
                    transition: color 0.3s;
                }
                
                .char-counter.warning {
                    color: var(--warning);
                }
                
                .char-counter.error {
                    color: var(--accent);
                    font-weight: 600;
                }
                
                /* Button loading state */
                button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                /* Mobile menu icon animation */
                .mobile-toggle i {
                    transition: transform 0.3s;
                }
                
                /* Modal enhancements */
                .modal-content {
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                /* Smooth transitions */
                .lang-content {
                    transition: opacity 0.3s ease;
                }
                
                .lang-content.active {
                    opacity: 1;
                }
                
                .lang-content:not(.active) {
                    opacity: 0;
                    height: 0;
                    overflow: hidden;
                    position: absolute;
                }
            `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = additionalStyles;
        document.head.appendChild(styleSheet);
    }
}

// ==================== INITIALIZE APPLICATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the application
    const app = new Application();
    app.initialize().catch(error => {
        console.error('Application initialization failed:', error);

        // Show user-friendly error message
        showToast(
            'Application failed to load. Please refresh the page.',
            'error'
        );
    });

    // Log initialization
    console.log('Marcio Lima English Teacher Portfolio loaded');
}); <
/script>