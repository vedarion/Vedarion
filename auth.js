// =============================================
// VEDARION AUTH SYSTEM
// =============================================
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://fqshijwiushtrncinjif.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mA1mUh0atDsGPYFclPoj8A_4c2bcYTR';

// Initialize Supabase client
const vedarionAuth = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// NAV AUTH STATE
// =============================================
async function updateNavAuth() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    const { data: { session } } = await vedarionAuth.auth.getSession();

    // Remove existing auth links
    const existingAuth = navLinks.querySelectorAll('.auth-link');
    existingAuth.forEach(el => el.remove());

    if (session) {
        // Get user's first name
        const firstName = session.user.user_metadata?.first_name || 'Student';

        // Dashboard link
        const dashLink = document.createElement('a');
        dashLink.href = 'dashboard.html';
        dashLink.textContent = 'Dashboard';
        dashLink.className = 'auth-link';
        navLinks.appendChild(dashLink);

        // Sign out link
        const signOutLink = document.createElement('a');
        signOutLink.href = '#';
        signOutLink.textContent = 'Sign Out';
        signOutLink.className = 'auth-link';
        signOutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await vedarionAuth.auth.signOut();
            window.location.href = 'index.html';
        });
        navLinks.appendChild(signOutLink);
    } else {
        const signInLink = document.createElement('a');
        signInLink.href = 'login.html';
        signInLink.textContent = 'Sign In';
        signInLink.className = 'auth-link';
        navLinks.appendChild(signInLink);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateNavAuth);

// Listen for auth state changes
vedarionAuth.auth.onAuthStateChange((event, session) => {
    updateNavAuth();
});

// =============================================
// HELPERS
// =============================================
async function requireAuth() {
    const { data: { session } } = await vedarionAuth.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

async function getCurrentUser() {
    const { data: { session } } = await vedarionAuth.auth.getSession();
    if (!session) return null;
    return {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.user_metadata?.first_name || '',
        createdAt: session.user.created_at
    };
}

async function redirectIfLoggedIn(destination = 'dashboard.html') {
    const { data: { session } } = await vedarionAuth.auth.getSession();
    if (session) {
        window.location.href = destination;
    }
}