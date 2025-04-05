// Wait for the DOM to fully load before attaching event listeners
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('loginBtn').addEventListener('click', login);

    // ✅ Password Toggle Features
    let togglePassword = document.getElementById("togglePassword");
    let passField = document.getElementById("loginPassword");

    togglePassword.addEventListener("click", function () {
        passField.type = passField.type === "password" ? "text" : "password";
    });

    // ✅ Check email existence when email input loses focus
    document.getElementById('loginEmail').addEventListener('blur', checkEmailExists);
});

// ✅ Function to check if email exists in DB
async function checkEmailExists() {
    let email = document.getElementById('loginEmail').value.trim();

    if (email) {
        try {
            const response = await fetch('${window.location.origin}/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            console.log("Check Email Response:", data);

            if (!data.exists) {
                document.getElementById('loginEmailError').innerText = 'Email not found in database';
            } else {
                document.getElementById('loginEmailError').innerText = '';
            }
        } catch (error) {
            console.error('Check Email Error:', error);
            document.getElementById('loginEmailError').innerText = 'Error checking email.';
        }
    }
}

// Login Function
async function login(event) {
    event.preventDefault(); // Prevent default form submission

    let email = document.getElementById('loginEmail').value.trim();
    let password = document.getElementById('loginPassword').value.trim();

    let isValid = true;

    // Email Validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('loginEmailError').innerText = 'Enter a valid email';
        isValid = false;
    } else {
        document.getElementById('loginEmailError').innerText = '';
    }

    // Password Validation
    if (password.length < 8) {
        document.getElementById('loginPasswordError').innerText = 'Password must be at least 8 characters';
        isValid = false;
    } else {
        document.getElementById('loginPasswordError').innerText = '';
    }

    if (isValid) {
        try {
            const response = await fetch('http://192.168.91.197:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log("Login Response:", data);

            if (data.success) {
                alert('Login successful!');

                // Redirect based on user stream
                console.log("Redirecting to:", data.stream);
                switch (data.stream) {
                    case "Student":
                        window.location.href = "/student_dashboard.html";
                        break;
                    case "Counsellor":
                        window.location.href = "/counselor_dashboard.html";
                        break;
                    case "Community":
                        window.location.href = "/community_dashboard.html";
                        break;
                    default:
                        alert("Stream not recognized.");
                }
            } else {
                document.getElementById('loginError').innerText = 'Invalid email or password';
            }
        } catch (error) {
            console.error('Login Error:', error);
            document.getElementById('loginError').innerText = 'An error occurred. Please try again.';
        }
    }
}
