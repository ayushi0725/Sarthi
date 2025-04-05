document.getElementById('nextBtn').addEventListener('click', async function (event) {
    event.preventDefault();

    let name = document.getElementById('name').value.trim();
    let mobile = document.getElementById('mobileNumber').value.trim();
    let email = document.getElementById('email').value.trim();
    let password = document.getElementById('signupPassword').value.trim();
    let confirmPassword = document.getElementById('confirmPassword').value.trim();
    let gender = document.querySelector('input[name="gender"]:checked')?.value;
    let stream = document.getElementById('streamSelect').value;

    let isValid = true;

    // Name Validation
    if (name.length < 3) {
        document.getElementById('nameError').innerText = 'Name must be at least 3 characters';
        isValid = false;
    } else {
        document.getElementById('nameError').innerText = '';
    }

    // Mobile Number Validation
    if (!/^[0-9]{10}$/.test(mobile)) {
        document.getElementById('mobileError').innerText = 'Enter a valid 10-digit number';
        isValid = false;
    } else {
        document.getElementById('mobileError').innerText = '';
    }

    // Email Validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('emailError').innerText = 'Enter a valid email';
        isValid = false;
    } else {
        document.getElementById('emailError').innerText = '';
    }

    // Password Validation
    if (password.length < 8) {
        document.getElementById('passwordError').innerText = 'Password must be at least 8 characters';
        isValid = false;
    } else {
        document.getElementById('passwordError').innerText = '';
    }

    // Confirm Password Validation
    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').innerText = 'Passwords do not match';
        isValid = false;
    } else {
        document.getElementById('confirmPasswordError').innerText = '';
    }

    // Gender Validation
    if (!gender) {
        document.getElementById('genderError').innerText = 'Please select a gender';
        isValid = false;
    } else {
        document.getElementById('genderError').innerText = '';
    }

    // Stream Validation
    let streamErrorEl = document.getElementById('streamError');

    if (!stream) {
        if (streamErrorEl) streamErrorEl.innerText = 'Please select a stream';
        isValid = false;
    } else {
        if (streamErrorEl) streamErrorEl.innerText = '';
    }
    

    if (isValid) {
        try {
            const response = await fetch('${window.location.origin}/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({name,mobile,email,password,confirmPassword,gender,stream})
            });
    
            if (!response.ok) {
                // Handle HTTP errors
                const errorText = await response.text();
                throw new Error(`Server Error: ${response.status} - ${errorText}`);
            }
    
            const data = await response.json();
            alert(data.message);
    
            if (data.message === 'User registered successfully') {
                window.location.href = 'nextPage.html';
            }
        } catch (error) {
            console.error('Signup Error:', error);
            alert('Error occurred during signup. Please try again.');
        }
    }
    
});
