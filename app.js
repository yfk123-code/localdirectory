// Configuration
const CONFIG = {
    // REPLACE THIS WITH YOUR DEPLOYED APPS SCRIPT URL
    API_BASE_URL: 'https://script.google.com/macros/s/AKfycbyvmdibTM4Y4k5iLnVM_OeerAks99Rfz0lZD2Eq_QXHS8LfPSXglFjFmDs0gtUzkm0eiQ/exec',
    CITY_NAME: 'Your City Name',
    WHATSAPP_COUNTRY_CODE: '91'
};

// State Management
const state = {
    currentUser: null,
    userRole: null,
    screen: 'auth',
    categories: [],
    businesses: [],
    currentCategory: null,
    currentBusiness: null,
    authStep: 'phone' // 'phone' or 'otp'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
});

function checkExistingSession() {
    const savedUser = localStorage.getItem('citybiz_user');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        state.currentUser = userData;
        state.userRole = userData.role;
        if (userData.role === 'business') {
            renderScreen('businessDashboard');
        } else {
            renderScreen('citizenHome');
        }
    } else {
        renderScreen('auth');
    }
}

// API Calls
async function apiCall(params) {
    const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    
    const url = `${CONFIG.API_BASE_URL}?${queryString}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

async function apiPost(params) {
    const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}?${queryString}`, {
            method: 'POST'
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

// Loading State
function showLoading() {
    document.getElementById('loadingScreen').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingScreen').classList.add('hidden');
}

// Screen Rendering
function renderScreen(screenName, data = {}) {
    state.screen = screenName;
    const container = document.getElementById('screenContainer');
    
    switch(screenName) {
        case 'auth':
            container.innerHTML = getAuthScreen();
            setupAuthListeners();
            break;
        case 'roleSelection':
            container.innerHTML = getRoleSelectionScreen();
            break;
        case 'businessRegistration':
            container.innerHTML = getBusinessRegistrationScreen();
            break;
        case 'citizenHome':
            container.innerHTML = getCitizenHomeScreen();
            loadCategories();
            loadUrgentServices();
            break;
        case 'businessDashboard':
            container.innerHTML = getBusinessDashboardScreen();
            break;
        case 'categoryListing':
            container.innerHTML = getCategoryListingScreen(data.category);
            loadBusinessesByCategory(data.category);
            break;
        case 'businessDetail':
            container.innerHTML = getBusinessDetailScreen();
            loadBusinessDetail(data.businessId);
            break;
        default:
            container.innerHTML = getAuthScreen();
            setupAuthListeners();
    }
}

// Auth Screen
function getAuthScreen() {
    return `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex flex-col">
            <div class="flex-1 flex flex-col justify-center">
                <div class="text-center mb-8 fade-in">
                    <div class="text-6xl mb-4">🏙️</div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">CityBiz</h1>
                    <p class="text-gray-600">Discover Local Businesses in ${CONFIG.CITY_NAME}</p>
                </div>
                
                <div class="bg-white rounded-2xl shadow-xl p-6 slide-up">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Welcome Back</h2>
                    
                    <!-- Phone Input Section -->
                    <div id="phoneSection" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                            <div class="flex">
                                <span class="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">
                                    +91
                                </span>
                                <input type="tel" id="phoneInput" 
                                    class="flex-1 block w-full px-3 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter 10-digit number" maxlength="10" pattern="[0-9]{10}">
                            </div>
                        </div>
                        <button id="sendOtpBtn" 
                            class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200">
                            Send OTP
                        </button>
                    </div>
                    
                    <!-- OTP Input Section (Initially Hidden) -->
                    <div id="otpSection" class="space-y-4 hidden">
                        <div class="text-center mb-4">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                            </div>
                            <p class="text-sm text-gray-600">OTP sent to +91 <span id="displayPhone"></span></p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                            <input type="text" id="otpInput" 
                                class="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                                placeholder="000000" maxlength="6" pattern="[0-9]{6}">
                            <p class="text-xs text-gray-500 mt-2 text-center">Demo OTP: Check browser console (F12)</p>
                        </div>
                        <button id="verifyOtpBtn" 
                            class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200">
                            Verify & Login
                        </button>
                        <button id="changeNumberBtn" 
                            class="w-full text-blue-600 py-2 text-sm hover:text-blue-800">
                            ← Change Number
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupAuthListeners() {
    // Send OTP Button
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', handleSendOTP);
    }
    
    // Verify OTP Button
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', handleVerifyOTP);
    }
    
    // Change Number Button
    const changeNumberBtn = document.getElementById('changeNumberBtn');
    if (changeNumberBtn) {
        changeNumberBtn.addEventListener('click', resetToPhoneInput);
    }
    
    // Allow Enter key on OTP input
    const otpInput = document.getElementById('otpInput');
    if (otpInput) {
        otpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleVerifyOTP();
            }
        });
    }
}

async function handleSendOTP() {
    const phoneInput = document.getElementById('phoneInput');
    const phone = phoneInput.value.trim();
    
    if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit mobile number');
        phoneInput.focus();
        return;
    }
    
    // Disable button and show loading
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    sendOtpBtn.disabled = true;
    sendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
    
    showLoading();
    const result = await apiPost({
        action: 'sendOTP',
        phone: phone
    });
    hideLoading();
    
    if (result.success) {
        console.log('📱 Demo OTP:', result.debug?.otp || '123456');
        console.log('ℹ️ Check this console for OTP during testing');
        
        // Show OTP section
        document.getElementById('phoneSection').classList.add('hidden');
        document.getElementById('otpSection').classList.remove('hidden');
        document.getElementById('displayPhone').textContent = phone;
        document.getElementById('otpInput').focus();
        
        // Store phone in state
        state.tempPhone = phone;
    } else {
        alert('Failed to send OTP. Please try again.');
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
    }
}

async function handleVerifyOTP() {
    const otpInput = document.getElementById('otpInput');
    const otp = otpInput.value.trim();
    const phone = state.tempPhone;
    
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        alert('Please enter a valid 6-digit OTP');
        otpInput.focus();
        return;
    }
    
    // Disable button and show loading
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying...';
    
    showLoading();
    const result = await apiPost({
        action: 'verifyOTP',
        phone: phone,
        otp: otp
    });
    
    if (result.success) {
        // Register user if not exists
        await apiPost({
            action: 'registerUser',
            phone: phone,
            name: 'User',
            role: 'citizen'
        });
        
        state.currentUser = { phone, name: 'User' };
        localStorage.setItem('citybiz_user', JSON.stringify(state.currentUser));
        hideLoading();
        renderScreen('roleSelection');
    } else {
        hideLoading();
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify & Login';
        alert('Invalid OTP. Please try again. (Demo OTP in console)');
        otpInput.value = '';
        otpInput.focus();
    }
}

function resetToPhoneInput() {
    document.getElementById('otpSection').classList.add('hidden');
    document.getElementById('phoneSection').classList.remove('hidden');
    document.getElementById('sendOtpBtn').disabled = false;
    document.getElementById('sendOtpBtn').textContent = 'Send OTP';
    document.getElementById('otpInput').value = '';
    state.tempPhone = null;
}

// Role Selection Screen
function getRoleSelectionScreen() {
    return `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex flex-col justify-center">
            <div class="text-center mb-8 fade-in">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">Welcome!</h1>
                <p class="text-gray-600">How would you like to use CityBiz?</p>
            </div>
            
            <div class="grid gap-4 slide-up">
                <button onclick="selectRole('citizen')" 
                    class="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-200 text-left border-2 border-transparent hover:border-blue-500">
                    <div class="text-4xl mb-3">👤</div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-1">Join as Citizen</h3>
                    <p class="text-gray-600 text-sm">Discover local businesses, find services, and connect instantly</p>
                </button>
                
                <button onclick="selectRole('business')" 
                    class="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition duration-200 text-left border-2 border-transparent hover:border-green-500">
                    <div class="text-4xl mb-3">🏪</div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-1">Join as Business</h3>
                    <p class="text-gray-600 text-sm">Register your business, reach local customers, and grow</p>
                </button>
            </div>
            
            <button onclick="logout()" class="mt-6 text-gray-600 hover:text-gray-800 text-sm">
                ← Back to Login
            </button>
        </div>
    `;
}

function selectRole(role) {
    state.userRole = role;
    state.currentUser.role = role;
    localStorage.setItem('citybiz_user', JSON.stringify(state.currentUser));
    
    if (role === 'citizen') {
        renderScreen('citizenHome');
    } else {
        renderScreen('businessRegistration');
    }
}

// Business Registration Screen
function getBusinessRegistrationScreen() {
    return `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-white shadow-sm p-4 flex items-center sticky top-0 z-10">
                <button onclick="renderScreen('roleSelection')" class="mr-3">
                    <i class="fas fa-arrow-left text-gray-600"></i>
                </button>
                <h1 class="text-xl font-semibold text-gray-800">Register Your Business</h1>
            </div>
            
            <div class="p-4 space-y-4">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-4">
                    <i class="fas fa-info-circle mr-2"></i>
                    Your business will be reviewed and approved within 24 hours
                </div>
                
                <form id="businessForm" onsubmit="submitBusiness(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                        <input type="text" name="businessName" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter business name">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <select name="category" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Select Category</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Hospital">Hospital</option>
                            <option value="Cafe">Cafe</option>
                            <option value="Restaurant">Restaurant</option>
                            <option value="Grocery">Grocery</option>
                            <option value="Pharmacy">Pharmacy</option>
                            <option value="Hardware">Hardware</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Education">Education</option>
                            <option value="Salon">Salon</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                        <select name="subCategory" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Select Sub Category</option>
                            <option value="Wholesale">Wholesale</option>
                            <option value="Retail">Retail</option>
                            <option value="24/7 Medical">24/7 Medical Store</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number *</label>
                        <div class="flex">
                            <span class="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600">+91</span>
                            <input type="tel" name="whatsappNumber" required 
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter WhatsApp number" maxlength="10">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                        <textarea name="address" required rows="3" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter complete address"></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</label>
                        <input type="url" name="logoLink" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Google Drive link for logo">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Photo URLs (Optional)</label>
                        <input type="text" name="photoLinks" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Comma-separated Google Drive links">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Map Location (Optional)</label>
                        <div class="flex space-x-2">
                            <input type="text" id="latitude" name="latitude" 
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Latitude">
                            <input type="text" id="longitude" name="longitude" 
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Longitude">
                        </div>
                        <button type="button" onclick="getCurrentLocation()" 
                            class="mt-2 text-blue-600 text-sm hover:text-blue-800">
                            <i class="fas fa-map-marker-alt mr-1"></i> Use Current Location
                        </button>
                    </div>
                    
                    <button type="submit" 
                        class="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition duration-200">
                        Submit for Approval
                    </button>
                </form>
            </div>
        </div>
    `;
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('latitude').value = position.coords.latitude;
                document.getElementById('longitude').value = position.coords.longitude;
            },
            () => alert('Unable to get location. Please enter manually.')
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

async function submitBusiness(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const businessData = {
        action: 'registerBusiness',
        ownerPhone: state.currentUser.phone,
        businessName: formData.get('businessName'),
        category: formData.get('category'),
        subCategory: formData.get('subCategory') || 'Retail',
        whatsappNumber: formData.get('whatsappNumber'),
        address: formData.get('address'),
        logoLink: formData.get('logoLink') || '',
        photoLinks: formData.get('photoLinks') || '',
        latitude: formData.get('latitude') || '',
        longitude: formData.get('longitude') || ''
    };
    
    if (!businessData.category) {
        alert('Please select a category');
        return;
    }
    
    showLoading();
    const result = await apiPost(businessData);
    hideLoading();
    
    if (result.success) {
        alert('✅ Business registered successfully! It will be visible after approval.');
        state.currentUser.role = 'business';
        localStorage.setItem('citybiz_user', JSON.stringify(state.currentUser));
        renderScreen('businessDashboard');
    } else {
        alert('❌ Failed to register business. Error: ' + (result.error || 'Unknown error'));
    }
}

// Citizen Home Screen
function getCitizenHomeScreen() {
    return `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h1 class="text-2xl font-bold">CityBiz</h1>
                        <p class="text-blue-100 text-sm">${CONFIG.CITY_NAME}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="showUrgentServices()" 
                            class="bg-red-500 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-600">
                            <i class="fas fa-ambulance mr-1"></i> Urgent
                        </button>
                        <button onclick="logout()" 
                            class="bg-white bg-opacity-20 px-3 py-2 rounded-lg text-sm hover:bg-opacity-30">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="p-4">
                <div id="urgentSection" class="mb-6 hidden">
                    <div class="bg-red-50 border border-red-200 rounded-xl p-4" id="urgentContent"></div>
                </div>
                
                <h2 class="text-lg font-semibold text-gray-800 mb-4">Explore Categories</h2>
                <div id="categoriesGrid" class="grid grid-cols-3 gap-3">
                    <!-- Categories will be loaded here -->
                    <div class="col-span-3 text-center py-8">
                        <div class="animate-pulse">
                            <div class="skeleton h-32 rounded-xl mb-3"></div>
                            <p class="text-gray-500">Loading categories...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadCategories() {
    showLoading();
    const result = await apiCall({ action: 'getCategories' });
    hideLoading();
    
    if (result.success && result.categories) {
        state.categories = result.categories;
        renderCategories();
    } else {
        // Default categories if API fails
        state.categories = [
            { name: 'Clothing', icon: '👕' },
            { name: 'Hospital', icon: '🏥' },
            { name: 'Cafe', icon: '☕' },
            { name: 'Restaurant', icon: '🍽️' },
            { name: 'Grocery', icon: '🛒' },
            { name: 'Pharmacy', icon: '💊' }
        ];
        renderCategories();
    }
}

function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    
    grid.innerHTML = state.categories.map(cat => `
        <button onclick="openCategory('${cat.name}')" 
            class="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 text-center active:scale-95 transform">
            <div class="text-3xl mb-2">${cat.icon}</div>
            <div class="text-xs font-medium text-gray-800">${cat.name}</div>
        </button>
    `).join('');
}

async function loadUrgentServices() {
    const result = await apiCall({ action: 'getUrgentServices' });
    if (result.success) {
        state.urgentServices = result.urgentServices;
        renderUrgentServices();
    }
}

function renderUrgentServices() {
    const section = document.getElementById('urgentSection');
    const content = document.getElementById('urgentContent');
    if (!section || !content || !state.urgentServices) return;
    
    section.classList.remove('hidden');
    content.innerHTML = `
        <h3 class="font-semibold text-red-800 mb-2">🚨 Emergency Services</h3>
        <div class="grid grid-cols-2 gap-2">
            ${state.urgentServices.emergencyNumbers?.map(service => `
                <a href="tel:${service.number}" 
                    class="bg-white p-2 rounded-lg text-center hover:bg-red-100">
                    <div class="text-lg">${service.icon}</div>
                    <div class="text-xs font-medium">${service.name}</div>
                    <div class="text-sm font-bold text-red-600">${service.number}</div>
                </a>
            `).join('') || ''}
        </div>
        ${state.urgentServices.medicalStores?.length > 0 ? `
            <div class="mt-3">
                <h4 class="text-sm font-semibold text-red-800 mb-1">24/7 Medical Stores</h4>
                ${state.urgentServices.medicalStores.slice(0, 3).map(store => `
                    <a href="https://wa.me/${CONFIG.WHATSAPP_COUNTRY_CODE}${store.phone}" target="_blank"
                        class="flex items-center justify-between bg-white p-2 rounded-lg mb-1 hover:bg-red-100">
                        <span class="text-sm">${store.name}</span>
                        <span class="text-green-600"><i class="fab fa-whatsapp"></i> Chat</span>
                    </a>
                `).join('')}
            </div>
        ` : ''}
    `;
}

function showUrgentServices() {
    const section = document.getElementById('urgentSection');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Category Listing Screen
function getCategoryListingScreen(category) {
    return `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-white shadow-sm p-4 flex items-center sticky top-0 z-10">
                <button onclick="renderScreen('citizenHome')" class="mr-3">
                    <i class="fas fa-arrow-left text-gray-600"></i>
                </button>
                <h1 class="text-xl font-semibold text-gray-800">${category}</h1>
            </div>
            
            <div class="p-4">
                <div class="flex space-x-2 mb-4">
                    <button onclick="filterBusinesses('Wholesale')" 
                        class="flex-1 py-2 px-4 bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-sm font-medium" id="tab-wholesale">
                        Wholesale
                    </button>
                    <button onclick="filterBusinesses('Retail')" 
                        class="flex-1 py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50" id="tab-retail">
                        Retail
                    </button>
                </div>
                
                <div id="businessList" class="space-y-3">
                    <div class="text-center py-8">
                        <div class="skeleton h-24 rounded-xl mb-3"></div>
                        <div class="skeleton h-24 rounded-xl mb-3"></div>
                        <p class="text-gray-500">Loading businesses...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadBusinessesByCategory(category) {
    state.currentCategory = category;
    await loadBusinessesBySubCategory('Wholesale');
}

function filterBusinesses(subCategory) {
    // Update active tab styling
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('bg-blue-50', 'border-blue-500', 'text-blue-600');
        tab.classList.add('bg-white', 'border-gray-300', 'text-gray-700');
    });
    const activeTab = document.getElementById(`tab-${subCategory.toLowerCase()}`);
    if (activeTab) {
        activeTab.classList.remove('bg-white', 'border-gray-300', 'text-gray-700');
        activeTab.classList.add('bg-blue-50', 'border-blue-500', 'text-blue-600');
    }
    
    loadBusinessesBySubCategory(subCategory);
}

async function loadBusinessesBySubCategory(subCategory) {
    showLoading();
    const result = await apiCall({
        action: 'getBusinesses',
        category: state.currentCategory,
        subCategory: subCategory
    });
    hideLoading();
    
    if (result.success) {
        state.businesses = result.businesses;
        renderBusinessList();
    } else {
        state.businesses = [];
        renderBusinessList();
    }
}

function renderBusinessList() {
    const list = document.getElementById('businessList');
    if (!list) return;
    
    if (!state.businesses || state.businesses.length === 0) {
        list.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">🏪</div>
                <p class="text-gray-500">No businesses found in this category</p>
                <p class="text-sm text-gray-400 mt-2">Be the first one to register!</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = state.businesses.map(business => `
        <div onclick="openBusinessDetail('${business.businessId}')" 
            class="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 cursor-pointer active:scale-98 transform">
            <div class="flex items-start space-x-3">
                <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                    ${business.logoLink ? 
                        `<img src="${business.logoLink}" alt="${business.businessName}" class="w-full h-full object-cover rounded-lg" onerror="this.style.display='none'; this.parentElement.innerHTML='🏪'">` : 
                        '🏪'}
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-800 truncate">${business.businessName}</h3>
                    <p class="text-sm text-gray-500 truncate">📍 ${business.address}</p>
                    <div class="flex items-center mt-1">
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">${business.category}</span>
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-1">${business.subCategory}</span>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); openWhatsApp('${business.whatsappNumber}')" 
                    class="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-600 flex-shrink-0">
                    <i class="fab fa-whatsapp"></i> Chat
                </button>
            </div>
        </div>
    `).join('');
}

// Business Detail Screen
function getBusinessDetailScreen() {
    return `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-white shadow-sm p-4 flex items-center sticky top-0 z-10">
                <button onclick="history.back()" class="mr-3">
                    <i class="fas fa-arrow-left text-gray-600"></i>
                </button>
                <h1 class="text-xl font-semibold text-gray-800">Business Details</h1>
            </div>
            
            <div id="businessDetailContent" class="animate-pulse">
                <div class="skeleton h-64"></div>
            </div>
        </div>
    `;
}

async function loadBusinessDetail(businessId) {
    showLoading();
    const result = await apiCall({
        action: 'getBusinessDetail',
        businessId: businessId
    });
    hideLoading();
    
    if (result.success) {
        state.currentBusiness = result.business;
        renderBusinessDetail();
    } else {
        document.getElementById('businessDetailContent').innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">😕</div>
                <p class="text-gray-500">Business not found</p>
                <button onclick="history.back()" class="mt-4 text-blue-600">Go back</button>
            </div>
        `;
    }
}

function renderBusinessDetail() {
    const content = document.getElementById('businessDetailContent');
    if (!content || !state.currentBusiness) return;
    
    const business = state.currentBusiness;
    
    content.innerHTML = `
        <div class="bg-white">
            <!-- Business Header -->
            <div class="relative">
                <div class="h-48 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    ${business.logoLink ? 
                        `<img src="${business.logoLink}" alt="${business.businessName}" class="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'text-6xl\\'>🏪</div>'">` :
                        `<div class="text-6xl">🏪</div>`}
                </div>
                <div class="p-4 text-center">
                    <h2 class="text-2xl font-bold text-gray-800">${business.businessName}</h2>
                    <div class="flex justify-center space-x-2 mt-2">
                        <span class="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">${business.category}</span>
                        <span class="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">${business.subCategory}</span>
                    </div>
                </div>
            </div>
            
            <!-- Contact Card -->
            <div class="px-4 pb-4">
                <div class="bg-gray-50 rounded-xl p-4 mb-4">
                    <h3 class="font-semibold text-gray-800 mb-3">📞 Contact Information</h3>
                    <div class="space-y-2">
                        <div class="flex items-center text-sm">
                            <i class="fas fa-map-marker-alt text-red-500 w-6"></i>
                            <span class="text-gray-600">${business.address}</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <i class="fab fa-whatsapp text-green-500 w-6"></i>
                            <span class="text-gray-600">+91 ${business.whatsappNumber}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <a href="https://wa.me/${CONFIG.WHATSAPP_COUNTRY_CODE}${business.whatsappNumber}" target="_blank"
                        class="bg-green-500 text-white py-3 rounded-lg text-center font-medium hover:bg-green-600 flex items-center justify-center">
                        <i class="fab fa-whatsapp mr-2 text-lg"></i> Chat on WhatsApp
                    </a>
                    <a href="tel:+91${business.whatsappNumber}" 
                        class="bg-blue-500 text-white py-3 rounded-lg text-center font-medium hover:bg-blue-600 flex items-center justify-center">
                        <i class="fas fa-phone mr-2"></i> Call Now
                    </a>
                </div>
                
                <!-- Photos Gallery -->
                ${business.photoLinks && business.photoLinks.length > 0 ? `
                    <div class="mb-4">
                        <h3 class="font-semibold text-gray-800 mb-3">📸 Photos</h3>
                        <div class="grid grid-cols-2 gap-2">
                            ${business.photoLinks.map(link => `
                                <img src="${link}" alt="Business photo" class="w-full h-32 object-cover rounded-lg" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function openCategory(category) {
    renderScreen('categoryListing', { category });
}

function openBusinessDetail(businessId) {
    renderScreen('businessDetail', { businessId });
}

function openWhatsApp(number) {
    window.open(`https://wa.me/${CONFIG.WHATSAPP_COUNTRY_CODE}${number}`, '_blank');
}

// Business Dashboard Screen
function getBusinessDashboardScreen() {
    return `
        <div class="min-h-screen bg-gray-50">
            <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold">My Business</h1>
                        <p class="text-green-100 text-sm">Dashboard</p>
                    </div>
                    <button onclick="logout()" class="bg-white bg-opacity-20 px-3 py-2 rounded-lg text-sm">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
            
            <div class="p-4">
                <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <div class="flex items-start">
                        <i class="fas fa-clock text-yellow-600 text-xl mr-3 mt-1"></i>
                        <div>
                            <h3 class="font-semibold text-yellow-800">Pending Approval</h3>
                            <p class="text-sm text-yellow-600">Your business listing is under review. It will be visible to citizens once approved.</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-md p-4">
                    <h3 class="font-semibold text-gray-800 mb-3">Quick Tips</h3>
                    <ul class="space-y-2 text-sm text-gray-600">
                        <li>• Add high-quality photos to attract more customers</li>
                        <li>• Keep your WhatsApp number active for instant inquiries</li>
                        <li>• Update your business hours in the description</li>
                    </ul>
                </div>
                
                <button onclick="renderScreen('businessRegistration')" 
                    class="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                    Register Another Business
                </button>
            </div>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('citybiz_user');
    state.currentUser = null;
    state.userRole = null;
    state.tempPhone = null;
    state.authStep = 'phone';
    renderScreen('auth');
}
