// ⚡ CityBiz Frontend - Complete Working Code
// ⚠️ IMPORTANT: Replace YOUR_SCRIPT_ID below with actual Apps Script deployment ID

const CONFIG = {
    // 🔴 PASTE YOUR ACTUAL APPS SCRIPT URL HERE
    API_BASE_URL: 'https://script.google.com/macros/s/AKfycby7wL0n-r_Fxht3WVtDPyN_wrY4Pf2ZttCMPa8BeJw_HKqN1B7PnfdPnDM_f-0jpgzX1Q/exec',
    CITY_NAME: 'Your City',
    COUNTRY_CODE: '91'
};

// State
const state = {
    currentUser: null,
    screen: 'auth',
    categories: [],
    businesses: [],
    currentCategory: null,
    phone: null
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('citybiz_user');
    if (user) {
        state.currentUser = JSON.parse(user);
        if (state.currentUser.role === 'business') renderScreen('businessDashboard');
        else renderScreen('citizenHome');
    } else {
        renderScreen('auth');
    }
});

// Loading
function showLoading() { document.getElementById('loadingOverlay').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.add('hidden'); }

// API Calls
async function apiCall(action, params = {}) {
    const query = new URLSearchParams({ action, ...params }).toString();
    const url = `${CONFIG.API_BASE_URL}?${query}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        return data;
    } catch (err) {
        console.error('API Error:', err);
        return { success: false, error: 'Network error' };
    }
}

async function apiPost(action, params = {}) {
    const query = new URLSearchParams({ action, ...params }).toString();
    const url = `${CONFIG.API_BASE_URL}?${query}`;
    
    try {
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        return data;
    } catch (err) {
        console.error('API Error:', err);
        return { success: false, error: 'Network error' };
    }
}

// Render Screen
function renderScreen(screen, data = {}) {
    state.screen = screen;
    const container = document.getElementById('screenContainer');
    
    switch(screen) {
        case 'auth': container.innerHTML = authScreen(); setupAuth(); break;
        case 'roleSelection': container.innerHTML = roleScreen(); break;
        case 'businessRegistration': container.innerHTML = businessRegScreen(); break;
        case 'citizenHome': container.innerHTML = citizenHomeScreen(); loadHomeData(); break;
        case 'businessDashboard': container.innerHTML = businessDashboardScreen(); break;
        case 'categoryList': container.innerHTML = categoryListScreen(data.category); loadBusinesses(data.category, 'Wholesale'); break;
        case 'businessDetail': container.innerHTML = businessDetailScreen(); loadBusinessDetail(data.businessId); break;
    }
}

// ==================== AUTH SCREEN ====================
function authScreen() {
    return `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center p-6">
        <div class="text-center mb-8 fade-in">
            <div class="text-7xl mb-4">🏙️</div>
            <h1 class="text-3xl font-extrabold text-gray-800">CityBiz</h1>
            <p class="text-gray-500 mt-1">Discover Local Businesses</p>
        </div>
        
        <div class="bg-white rounded-3xl shadow-xl p-6 slide-up">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Welcome</h2>
            
            <div id="phoneStep">
                <label class="block text-sm font-semibold text-gray-600 mb-2">Mobile Number</label>
                <div class="flex mb-4">
                    <span class="bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl px-3 flex items-center text-gray-500 font-medium">+91</span>
                    <input type="tel" id="phoneInput" maxlength="10" placeholder="Enter 10-digit number"
                        class="flex-1 border border-gray-300 rounded-r-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <button id="sendOtpBtn" class="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition">
                    <span id="sendOtpText">Send OTP</span>
                </button>
            </div>
            
            <div id="otpStep" class="hidden">
                <div class="text-center mb-4">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <i class="fas fa-check-circle text-green-500 text-3xl"></i>
                    </div>
                    <p class="text-sm text-gray-500">OTP sent to <span id="displayPhone" class="font-bold text-gray-700"></span></p>
                </div>
                <label class="block text-sm font-semibold text-gray-600 mb-2">Enter OTP</label>
                <input type="text" id="otpInput" maxlength="6" placeholder="000000"
                    class="w-full border border-gray-300 rounded-xl px-4 py-3 text-2xl text-center tracking-widest font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <p class="text-xs text-gray-400 text-center mb-3">🔍 Check console (F12) for demo OTP</p>
                <button id="verifyOtpBtn" class="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition mb-2">
                    Verify & Login
                </button>
                <button id="changeNumberBtn" class="w-full text-blue-500 py-2 text-sm font-medium hover:text-blue-700">← Change Number</button>
            </div>
        </div>
    </div>`;
}

function setupAuth() {
    document.getElementById('sendOtpBtn').addEventListener('click', async () => {
        const phone = document.getElementById('phoneInput').value.trim();
        if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }
        
        const btn = document.getElementById('sendOtpBtn');
        btn.disabled = true;
        document.getElementById('sendOtpText').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
        
        showLoading();
        const result = await apiPost('sendOTP', { phone });
        hideLoading();
        
        if (result.success) {
            console.log('📱 DEMO OTP:', result.debug?.otp || 'Check console');
            state.phone = phone;
            document.getElementById('phoneStep').classList.add('hidden');
            document.getElementById('otpStep').classList.remove('hidden');
            document.getElementById('displayPhone').textContent = '+91 ' + phone;
            document.getElementById('otpInput').focus();
        } else {
            alert('Failed to send OTP: ' + (result.error || 'Try again'));
            btn.disabled = false;
            document.getElementById('sendOtpText').textContent = 'Send OTP';
        }
    });
    
    document.getElementById('verifyOtpBtn').addEventListener('click', async () => {
        const otp = document.getElementById('otpInput').value.trim();
        if (!otp || otp.length !== 6) {
            alert('Please enter 6-digit OTP');
            return;
        }
        
        showLoading();
        const result = await apiPost('verifyOTP', { phone: state.phone, otp });
        
        if (result.success) {
            await apiPost('registerUser', { phone: state.phone, name: 'User', role: 'citizen' });
            state.currentUser = { phone: state.phone, name: 'User' };
            localStorage.setItem('citybiz_user', JSON.stringify(state.currentUser));
            hideLoading();
            renderScreen('roleSelection');
        } else {
            hideLoading();
            alert('Invalid OTP: ' + (result.error || 'Try again'));
            document.getElementById('otpInput').value = '';
        }
    });
    
    document.getElementById('changeNumberBtn').addEventListener('click', () => {
        document.getElementById('otpStep').classList.add('hidden');
        document.getElementById('phoneStep').classList.remove('hidden');
        document.getElementById('sendOtpBtn').disabled = false;
        document.getElementById('sendOtpText').textContent = 'Send OTP';
        document.getElementById('otpInput').value = '';
    });
    
    document.getElementById('otpInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('verifyOtpBtn').click();
    });
}

// ==================== ROLE SELECTION ====================
function roleScreen() {
    return `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center p-6">
        <div class="text-center mb-8 fade-in">
            <h1 class="text-3xl font-extrabold text-gray-800">Welcome!</h1>
            <p class="text-gray-500 mt-2">How would you like to use CityBiz?</p>
        </div>
        <div class="space-y-4 slide-up">
            <button onclick="selectRole('citizen')" class="w-full bg-white p-6 rounded-2xl shadow-lg text-left border-2 border-transparent hover:border-blue-500 active:scale-95 transition">
                <span class="text-4xl">👤</span>
                <h3 class="text-xl font-bold text-gray-800 mt-2">Join as Citizen</h3>
                <p class="text-gray-500 text-sm">Discover businesses & services near you</p>
            </button>
            <button onclick="selectRole('business')" class="w-full bg-white p-6 rounded-2xl shadow-lg text-left border-2 border-transparent hover:border-green-500 active:scale-95 transition">
                <span class="text-4xl">🏪</span>
                <h3 class="text-xl font-bold text-gray-800 mt-2">Join as Business</h3>
                <p class="text-gray-500 text-sm">Register your business & reach customers</p>
            </button>
        </div>
        <button onclick="logout()" class="mt-6 text-gray-500 hover:text-gray-700 text-sm text-center">← Logout</button>
    </div>`;
}

function selectRole(role) {
    state.currentUser.role = role;
    localStorage.setItem('citybiz_user', JSON.stringify(state.currentUser));
    renderScreen(role === 'citizen' ? 'citizenHome' : 'businessRegistration');
}

// ==================== CITIZEN HOME ====================
function citizenHomeScreen() {
    return `
    <div class="min-h-screen bg-gray-50">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-extrabold">🏙️ CityBiz</h1>
                    <p class="text-blue-100 text-xs">${CONFIG.CITY_NAME}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="toggleUrgent()" class="bg-red-500 px-3 py-2 rounded-xl text-sm font-bold hover:bg-red-600">
                        🚨 Urgent
                    </button>
                    <button onclick="logout()" class="bg-white/20 px-3 py-2 rounded-xl text-sm hover:bg-white/30">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <div id="urgentSection" class="hidden mx-4 mt-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4" id="urgentContent"></div>
        
        <div class="p-4">
            <h2 class="text-lg font-bold text-gray-800 mb-3">Explore Categories</h2>
            <div id="categoriesGrid" class="grid grid-cols-3 gap-3">
                <div class="col-span-3 text-center py-8"><div class="animate-pulse text-gray-400">Loading...</div></div>
            </div>
        </div>
    </div>`;
}

async function loadHomeData() {
    showLoading();
    const catResult = await apiCall('getCategories');
    const urgentResult = await apiCall('getUrgentServices');
    hideLoading();
    
    if (catResult.success) {
        state.categories = catResult.categories;
        renderCategories();
    } else {
        document.getElementById('categoriesGrid').innerHTML = '<div class="col-span-3 text-center py-8 text-gray-500">Could not load categories</div>';
    }
    
    if (urgentResult.success) {
        state.urgentServices = urgentResult.urgentServices;
        renderUrgent();
    }
}

function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    grid.innerHTML = state.categories.map(c => `
        <button onclick="openCategory('${c.name}')" class="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition text-center">
            <div class="text-3xl mb-1">${c.icon}</div>
            <div class="text-xs font-bold text-gray-700 truncate">${c.name}</div>
        </button>
    `).join('');
}

function renderUrgent() {
    const section = document.getElementById('urgentSection');
    const content = document.getElementById('urgentContent');
    if (!section || !content) return;
    
    const s = state.urgentServices;
    content.innerHTML = `
        <h3 class="font-bold text-red-800 mb-2">🚨 Emergency Services</h3>
        <div class="grid grid-cols-2 gap-2 mb-3">
            ${(s.emergencyNumbers || []).map(e => `
                <a href="tel:${e.number}" class="bg-white p-3 rounded-xl text-center hover:bg-red-100">
                    <div class="text-2xl">${e.icon}</div>
                    <div class="text-xs font-bold">${e.name}</div>
                    <div class="text-sm font-extrabold text-red-600">${e.number}</div>
                </a>
            `).join('')}
        </div>
        ${(s.medicalStores || []).length > 0 ? `
            <h4 class="font-bold text-red-800 text-sm mb-1">💊 24/7 Medical Stores</h4>
            ${s.medicalStores.slice(0,3).map(m => `
                <a href="https://wa.me/${CONFIG.COUNTRY_CODE}${m.phone}" target="_blank"
                    class="flex justify-between items-center bg-white p-3 rounded-xl mb-1 hover:bg-red-100">
                    <span class="text-sm font-medium">${m.name}</span>
                    <span class="text-green-600 text-xs font-bold"><i class="fab fa-whatsapp"></i> Chat</span>
                </a>
            `).join('')}
        ` : ''}
    `;
    section.classList.remove('hidden');
}

function toggleUrgent() {
    const s = document.getElementById('urgentSection');
    if (s) s.classList.toggle('hidden');
}

// ==================== CATEGORY LIST ====================
function categoryListScreen(category) {
    return `
    <div class="min-h-screen bg-gray-50">
        <div class="bg-white shadow-sm p-4 flex items-center sticky top-0 z-10">
            <button onclick="renderScreen('citizenHome')" class="mr-3 text-gray-600"><i class="fas fa-arrow-left text-xl"></i></button>
            <h1 class="text-xl font-extrabold text-gray-800">${category}</h1>
        </div>
        <div class="p-4">
            <div class="flex gap-2 mb-4">
                <button onclick="filterBiz('Wholesale')" id="tab-wholesale" class="flex-1 py-2.5 bg-blue-50 border-2 border-blue-500 text-blue-600 rounded-xl font-bold text-sm">Wholesale</button>
                <button onclick="filterBiz('Retail')" id="tab-retail" class="flex-1 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-sm">Retail</button>
            </div>
            <div id="businessList" class="space-y-3">
                <div class="text-center py-8 text-gray-400">Loading...</div>
            </div>
        </div>
    </div>`;
}

async function loadBusinesses(category, subCategory) {
    showLoading();
    const result = await apiCall('getBusinesses', { category, subCategory });
    hideLoading();
    
    if (result.success) {
        state.businesses = result.businesses;
        renderBusinessList();
    } else {
        document.getElementById('businessList').innerHTML = '<div class="text-center py-8 text-gray-500">No businesses found</div>';
    }
}

async function filterBiz(subCategory) {
    document.querySelectorAll('[id^="tab-"]').forEach(t => {
        t.className = 'flex-1 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-sm';
    });
    const tab = document.getElementById('tab-' + subCategory.toLowerCase());
    if (tab) tab.className = 'flex-1 py-2.5 bg-blue-50 border-2 border-blue-500 text-blue-600 rounded-xl font-bold text-sm';
    
    await loadBusinesses(state.currentCategory, subCategory);
}

function renderBusinessList() {
    const list = document.getElementById('businessList');
    if (!list) return;
    
    if (!state.businesses.length) {
        list.innerHTML = '<div class="text-center py-12"><div class="text-6xl mb-3">🏪</div><p class="text-gray-500">No businesses yet</p></div>';
        return;
    }
    
    list.innerHTML = state.businesses.map(b => `
        <div onclick="openBusinessDetail('${b.businessId}')" class="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg cursor-pointer active:scale-98 transition">
            <div class="flex gap-3">
                <div class="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏪</div>
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-gray-800 truncate">${b.businessName}</h3>
                    <p class="text-xs text-gray-500 truncate">📍 ${b.address}</p>
                    <div class="flex gap-1 mt-1">
                        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">${b.category}</span>
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${b.subCategory}</span>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); window.open('https://wa.me/${CONFIG.COUNTRY_CODE}${b.whatsappNumber}', '_blank')" 
                    class="bg-green-500 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-green-600 flex-shrink-0 self-center">
                    <i class="fab fa-whatsapp"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openCategory(category) {
    state.currentCategory = category;
    renderScreen('categoryList', { category });
}

// ==================== BUSINESS DETAIL ====================
function businessDetailScreen() {
    return `
    <div class="min-h-screen bg-gray-50">
        <div class="bg-white shadow-sm p-4 flex items-center sticky top-0 z-10">
            <button onclick="history.back()" class="mr-3 text-gray-600"><i class="fas fa-arrow-left text-xl"></i></button>
            <h1 class="text-xl font-extrabold text-gray-800">Business Details</h1>
        </div>
        <div id="detailContent" class="animate-pulse"><div class="h-64 bg-gray-200"></div></div>
    </div>`;
}

async function loadBusinessDetail(businessId) {
    showLoading();
    const result = await apiCall('getBusinessDetail', { businessId });
    hideLoading();
    
    const content = document.getElementById('detailContent');
    if (!content) return;
    
    if (!result.success) {
        content.innerHTML = '<div class="text-center py-12"><div class="text-6xl mb-3">😕</div><p class="text-gray-500">Business not found</p></div>';
        return;
    }
    
    const b = result.business;
    content.innerHTML = `
    <div class="bg-white">
        <div class="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <div class="text-7xl">🏪</div>
        </div>
        <div class="p-4 text-center -mt-10">
            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg text-4xl">🏪</div>
            <h2 class="text-2xl font-extrabold text-gray-800 mt-2">${b.businessName}</h2>
            <div class="flex justify-center gap-2 mt-1">
                <span class="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">${b.category}</span>
                <span class="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">${b.subCategory}</span>
            </div>
        </div>
        <div class="px-4 pb-6 space-y-4">
            <div class="bg-gray-50 rounded-2xl p-4">
                <h3 class="font-bold text-gray-800 mb-2">📞 Contact</h3>
                <p class="text-sm text-gray-600"><i class="fas fa-map-marker-alt text-red-500 mr-2"></i>${b.address}</p>
                <p class="text-sm text-gray-600 mt-1"><i class="fab fa-whatsapp text-green-500 mr-2"></i>+91 ${b.whatsappNumber}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <a href="https://wa.me/${CONFIG.COUNTRY_CODE}${b.whatsappNumber}" target="_blank"
                    class="bg-green-500 text-white py-3.5 rounded-xl text-center font-bold hover:bg-green-600 flex items-center justify-center gap-2">
                    <i class="fab fa-whatsapp text-xl"></i> WhatsApp
                </a>
                <a href="tel:+91${b.whatsappNumber}"
                    class="bg-blue-500 text-white py-3.5 rounded-xl text-center font-bold hover:bg-blue-600 flex items-center justify-center gap-2">
                    <i class="fas fa-phone"></i> Call Now
                </a>
            </div>
        </div>
    </div>`;
}

function openBusinessDetail(businessId) {
    renderScreen('businessDetail', { businessId });
}

// ==================== BUSINESS REGISTRATION ====================
function businessRegScreen() {
    return `
    <div class="min-h-screen bg-gray-50">
        <div class="bg-white shadow-sm p-4 flex items-center sticky top-0 z-10">
            <button onclick="renderScreen('roleSelection')" class="mr-3 text-gray-600"><i class="fas fa-arrow-left text-xl"></i></button>
            <h1 class="text-xl font-extrabold text-gray-800">Register Business</h1>
        </div>
        <div class="p-4">
            <div class="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-4 text-sm text-blue-800">
                ⏳ Your business will be reviewed within 24 hours
            </div>
            <form id="bizForm" onsubmit="submitBiz(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Business Name *</label>
                    <input type="text" name="businessName" required class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter business name">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                    <select name="category" required class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        <option>Clothing</option><option>Hospital</option><option>Cafe</option><option>Restaurant</option>
                        <option>Grocery</option><option>Pharmacy</option><option>Hardware</option><option>Electronics</option>
                        <option>Education</option><option>Salon</option><option>Gym</option><option>Automobile</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Sub Category</label>
                    <select name="subCategory" class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        <option>Wholesale</option><option>Retail</option><option>24/7 Medical</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">WhatsApp Number *</label>
                    <div class="flex">
                        <span class="bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl px-3 flex items-center text-gray-500">+91</span>
                        <input type="tel" name="whatsappNumber" required maxlength="10" class="flex-1 border border-gray-300 rounded-r-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" placeholder="WhatsApp number">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Address *</label>
                    <textarea name="address" required rows="2" class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" placeholder="Full address"></textarea>
                </div>
                <div class="flex gap-2">
                    <input type="text" name="latitude" placeholder="Latitude (optional)" class="flex-1 border border-gray-300 rounded-xl px-4 py-3">
                    <input type="text" name="longitude" placeholder="Longitude (optional)" class="flex-1 border border-gray-300 rounded-xl px-4 py-3">
                </div>
                <button type="button" onclick="getLocation()" class="text-blue-600 text-sm font-bold"><i class="fas fa-map-marker-alt mr-1"></i>Use Current Location</button>
                <button type="submit" class="w-full bg-green-600 text-white py-3.5 rounded-xl font-extrabold text-lg hover:bg-green-700 active:scale-95 transition">Submit for Approval</button>
            </form>
        </div>
    </div>`;
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                document.querySelector('[name="latitude"]').value = pos.coords.latitude;
                document.querySelector('[name="longitude"]').value = pos.coords.longitude;
            },
            () => alert('Could not get location')
        );
    }
}

async function submitBiz(e) {
    e.preventDefault();
    const form = document.getElementById('bizForm');
    const fd = new FormData(form);
    
    showLoading();
    const result = await apiPost('registerBusiness', {
        ownerPhone: state.currentUser.phone,
        businessName: fd.get('businessName'),
        category: fd.get('category'),
        subCategory: fd.get('subCategory') || 'Retail',
        whatsappNumber: fd.get('whatsappNumber'),
        address: fd.get('address'),
        latitude: fd.get('latitude') || '',
        longitude: fd.get('longitude') || ''
    });
    hideLoading();
    
    if (result.success) {
        alert('✅ Registered! Awaiting approval.');
        state.currentUser.role = 'business';
        localStorage.setItem('citybiz_user', JSON.stringify(state.currentUser));
        renderScreen('businessDashboard');
    } else {
        alert('❌ Failed: ' + (result.error || 'Try again'));
    }
}

// ==================== BUSINESS DASHBOARD ====================
function businessDashboardScreen() {
    return `
    <div class="min-h-screen bg-gray-50">
        <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white p-5">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-extrabold">🏪 My Business</h1>
                <button onclick="logout()" class="bg-white/20 px-3 py-2 rounded-xl text-sm"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
        </div>
        <div class="p-4">
            <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
                <h3 class="font-bold text-yellow-800">⏳ Pending Approval</h3>
                <p class="text-sm text-yellow-600">Visible after approval</p>
            </div>
            <button onclick="renderScreen('businessRegistration')" class="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700">Register Another</button>
        </div>
    </div>`;
}

// ==================== UTILS ====================
function logout() {
    localStorage.removeItem('citybiz_user');
    state.currentUser = null;
    state.phone = null;
    renderScreen('auth');
}
