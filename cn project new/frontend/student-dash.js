document.addEventListener("DOMContentLoaded", () => {
    // checkLoginStatus();
    personalizeDashboard();
    checkTestStatus();
    fetchAllCounselors();
});

// function checkLoginStatus() {
//     const email = localStorage.getItem("userEmail");
//     if (!email) {
//         alert("You must be logged in to view this page.");
//         window.location.href = "login.html";
//     }
// }

function personalizeDashboard() {
    const name = localStorage.getItem("userName") || "User";
    const stream = localStorage.getItem("userStream") || "General";

    const userNameHeading = document.querySelector(".user-info h3");
    if (userNameHeading) {
        userNameHeading.innerText = `Welcome, ${name}`;
    }

    if (stream === "Counsellor") {
        document.querySelector(".career-paths-section")?.remove();
    } else if (stream === "Community") {
        document.querySelector(".assessment-section")?.remove();
    }
}

function checkTestStatus() {
    const isTestDone = localStorage.getItem("aptitudeTestDone");
    const result = localStorage.getItem("aptitudeTestResult");
    const container = document.querySelector(".aptitude-test-action");

    if (container) {
        if (isTestDone === "true") {
            container.innerHTML = `
                <span class="test-status-done">✅ Done</span>
                <p style="margin-top: 10px; color: #90ee90;"><em>${result}</em></p>
            `;
        } else {
            container.innerHTML = `<a href="aptitude-test.html" class="start-test">Take Aptitude Test</a>`;
        }
    }
}

    function searchCounselor() {
        const searchTerm = document.getElementById('counselorSearch').value.toLowerCase();
        const resultsDiv = document.getElementById('counselorResults');
        resultsDiv.innerHTML = 'Searching...';
    
        fetch(`/api/counselors?stream=${searchTerm}`)
            .then(res => res.json())
            .then(data => {
                resultsDiv.innerHTML = '';
    
                if (!data.success || data.counselors.length === 0) {
                    resultsDiv.innerHTML = '<p>No counselors found for this stream.</p>';
                    return;
                }
    
                data.counselors.forEach(counselor => {
                    resultsDiv.innerHTML += `
                        <div class="counselor-card">
                            <div class="counselor-info">
                                <h3>${counselor.name}</h3>
                                <p><strong>Specialization:</strong> ${counselor.specialization}</p>
                                <p><strong>Experience:</strong> ${counselor.experience}</p>
                                <p><strong>Bio:</strong> ${counselor.bio}</p>
                            </div>
                            <button onclick="scheduleMeeting(${counselor.id}, '${counselor.name}')">Schedule Meeting</button>
                        </div>
                    `;
                });
            })
            .catch(err => {
                resultsDiv.innerHTML = '<p>Error fetching counselors.</p>';
                console.error(err);
            });
    }
    
    function fetchAllCounselors() {
        const resultsDiv = document.getElementById('counselorResults');
        resultsDiv.innerHTML = 'Loading...';
    
        fetch('/api/counselors/all')
            .then(res => res.json())
            .then(data => {
                resultsDiv.innerHTML = '';
    
                if (!data.success || data.counselors.length === 0) {
                    resultsDiv.innerHTML = '<p>No counselors available right now.</p>';
                    return;
                }
    
                data.counselors.forEach(counselor => {
                    resultsDiv.innerHTML += `
                        <div class="counselor-card">
                            <div class="counselor-info">
                                <h3>${counselor.name}</h3>
                                <p><strong>Specialization:</strong> ${counselor.specialization}</p>
                                <p><strong>Experience:</strong> ${counselor.experience}</p>
                                <p><strong>Bio:</strong> ${counselor.bio}</p>
                            </div>
                            <button onclick="scheduleMeeting(${counselor.id}, '${counselor.name}')">Request Meeting</button>
                        </div>
                    `;
                });
    
                // Optional: Scroll to counselor section
                resultsDiv.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(err => {
                resultsDiv.innerHTML = '<p>Error loading counselors.</p>';
                console.error(err);
            });
    }
    
    function showAllCounselors() {
        fetchAllCounselors();
    }

    function scheduleMeeting(counselorId, name) {
        const studentId = localStorage.getItem('userId');
        const dateTime = prompt(`Enter preferred date and time for a session with ${name}:`);
        const message = prompt(`Leave a message for ${name}:`);
    
        if (!dateTime || !message) return;
    
        fetch('/api/meetings/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, counselorId, dateTime, message })
        })
        .then(res => res.json())
        .then(data => alert(data.message))
        .catch(err => alert('Request failed'));
    }
    

function requestMeeting(counselorId) {
    const dateTime = document.getElementById(`meeting-${counselorId}`).value;
    const message = document.getElementById(`message-${counselorId}`).value;
    const studentId = localStorage.getItem('userId');

    if (!dateTime || !message) return alert("Please fill date and message");

    fetch('/api/meetings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, counselorId, dateTime, message })
    })
    .then(res => res.json())
    .then(data => alert(data.message))
    .catch(err => alert("Failed to send request"));
}


function startTest(type) {
    alert(`Starting ${type} test`);
}

function exploreCareer(field) {
    alert(`Exploring ${field} career path`);
}

document.getElementById('aptitudeTestForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const answers = {
        q1: document.querySelector('input[name="q1"]:checked')?.value,
        q2: document.querySelector('input[name="q2"]:checked')?.value,
        q3: document.querySelector('input[name="q3"]:checked')?.value
    };

    if (!answers.q1 || !answers.q2 || !answers.q3) {
        alert("Please answer all questions.");
        return;
    }

    const score = Object.values(answers).filter(ans => ans === 'a').length;
    const resultBox = document.getElementById("testResult");

    if (score >= 2) {
        resultBox.innerHTML = "<p><strong>Result:</strong> You might be inclined toward technical or analytical careers like engineering, IT, or science.</p>";
        localStorage.setItem("aptitudeTestDone", "true");
        localStorage.setItem("aptitudeTestResult", "You lean towards analytical or tech fields.");
    } else {
        resultBox.innerHTML = "<p><strong>Result:</strong> You may thrive in creative or people-oriented careers like arts, counseling, or humanities.</p>";
        localStorage.setItem("aptitudeTestDone", "true");
        localStorage.setItem("aptitudeTestResult", "You lean towards creative or people-oriented fields.");
    }
});
