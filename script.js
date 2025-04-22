// DOM Elements
const navbar = document.querySelector('.navbar');
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
const themeToggle = document.querySelector('.theme-toggle');
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');
const skillBars = document.querySelectorAll('.progress');
const contactForm = document.querySelector('.contact-form');

// Theme Management
const getCurrentTheme = () => document.documentElement.getAttribute('data-theme') || 'light';
const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
};

const updateThemeIcon = (theme) => {
    themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
};

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

// Theme toggle event
themeToggle.addEventListener('click', () => {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
});

// Mobile Menu Toggle
let menuOpen = false;
menuBtn.addEventListener('click', () => {
    menuOpen = !menuOpen;
    menuBtn.classList.toggle('open');
    navLinks.classList.toggle('show');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (menuOpen && !e.target.closest('.navbar')) {
        menuOpen = false;
        menuBtn.classList.remove('open');
        navLinks.classList.remove('show');
    }
});

// Navbar Scroll Effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
        navbar.classList.remove('scroll-up');
        navbar.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
        navbar.classList.remove('scroll-down');
        navbar.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            if (menuOpen) {
                menuOpen = false;
                menuBtn.classList.remove('open');
                navLinks.classList.remove('show');
            }
        }
    });
});

// Project Filtering
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        projectCards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
            } else {
                const categories = card.getAttribute('data-categories').split(',');
                if (categories.includes(filter)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    });
});

// Skills Animation
const animateSkills = () => {
    skillBars.forEach(bar => {
        const percentage = bar.getAttribute('data-progress');
        bar.style.width = percentage + '%';
    });
};

// Intersection Observer for Skills Animation
const skillsSection = document.querySelector('.skills');
const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateSkills();
            skillsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

if (skillsSection) {
    skillsObserver.observe(skillsSection);
}

// Get CSRF token
async function getCsrfToken() {
    try {
        const response = await fetch('/simple-portfolio/php/get_csrf_token.php');
        const data = await response.json();
        if (data.csrf_token) {
            document.getElementById('csrfToken').value = data.csrf_token;
        }
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    AOS.init({
        duration: 1000,
        once: true
    });

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    console.log('Contact form found:', contactForm); // Debug log

    if (contactForm) {
        // Get CSRF token when page loads
        getCsrfToken();

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Form submitted'); // Debug log
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(this);
                console.log('Form data:', Object.fromEntries(formData)); // Debug log

                const response = await fetch('/simple-portfolio/php/contact_handler.php', {
                    method: 'POST',
                    body: formData
                });

                console.log('Response status:', response.status); // Debug log
                const result = await response.json();
                console.log('Response data:', result); // Debug log
                
                if (result.success) {
                    alert(result.message);
                    contactForm.reset();
                    
                    // Update CSRF token
                    if (result.csrf_token) {
                        document.getElementById('csrfToken').value = result.csrf_token;
                    }
                } else {
                    alert(result.message || 'An error occurred. Please try again.');
                }
            } catch (error) {
                console.error('Error details:', error); // Detailed error logging
                alert('An error occurred. Please try again.');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    } else {
        console.error('Contact form not found in the document'); // Debug log
    }

    // Theme toggle functionality
    const body = document.body;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'dark') {
            themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = themeToggle.querySelector('i');
        icon.classList.replace(
            newTheme === 'dark' ? 'fa-moon' : 'fa-sun',
            newTheme === 'dark' ? 'fa-sun' : 'fa-moon'
        );
    });

    // Mobile menu functionality
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    let menuOpen = false;

    menuBtn.addEventListener('click', () => {
        if (!menuOpen) {
            menuBtn.classList.add('open');
            navLinks.classList.add('active');
            menuOpen = true;
            menuBtn.setAttribute('aria-expanded', 'true');
        } else {
            menuBtn.classList.remove('open');
            navLinks.classList.remove('active');
            menuOpen = false;
            menuBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // Project filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            
            projectCards.forEach(card => {
                if (filter === 'all' || card.dataset.categories.includes(filter)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Update copyright year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});

// Notification System
const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

// Typing Animation for Hero Section
const typeWriter = (element, text, speed = 100) => {
    let i = 0;
    element.textContent = '';
    
    const typing = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typing);
        }
    }, speed);
};

// Initialize typing animation
const heroTitle = document.querySelector('.hero-text h1');
if (heroTitle) {
    window.addEventListener('load', () => {
        typeWriter(heroTitle, heroTitle.getAttribute('data-text') || heroTitle.textContent);
    });
}

// Lazy Loading for Images
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
            observer.unobserve(img);
        }
    });
});

lazyImages.forEach(img => imageObserver.observe(img));

// Add active class to navigation links based on scroll position
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelector(`.nav-links a[href*=${sectionId}]`)?.classList.add('active');
        } else {
            document.querySelector(`.nav-links a[href*=${sectionId}]`)?.classList.remove('active');
        }
    });
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
} 