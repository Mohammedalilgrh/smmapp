let connectedAccounts = JSON.parse(localStorage.getItem('connectedAccounts') || '[]');
let scheduledPosts = JSON.parse(localStorage.getItem('scheduledPosts') || '[]');
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    if (isLoggedIn && connectedAccounts.length > 0) {
        showMainApp();
    }
    
    // Schedule type change handler
    document.querySelectorAll('input[name="scheduleType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const picker = document.getElementById('datetimePicker');
            picker.style.display = this.value === 'later' ? 'block' : 'none';
        });
    });
    
    updateConnectedAccountsDisplay();
    displayScheduledPosts();
    
    // Set minimum datetime to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('scheduleTime').min = now.toISOString().slice(0, 16);
});

function connectAccount(platform) {
    // Simulate OAuth connection
    showStatus('Connecting to ' + platform + '...', 'info');
    
    setTimeout(() => {
        if (!connectedAccounts.includes(platform)) {
            connectedAccounts.push(platform);
            localStorage.setItem('connectedAccounts', JSON.stringify(connectedAccounts));
            localStorage.setItem('isLoggedIn', 'true');
            isLoggedIn = true;
        }
        
        showStatus('Successfully connected to ' + platform + '!', 'success');
        updateConnectedAccountsDisplay();
        
        if (connectedAccounts.length > 0) {
            setTimeout(() => {
                showMainApp();
            }, 1500);
        }
    }, 2000);
}

function showMainApp() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').style.display = 'block';
    event.target.classList.add('active');
}

function createPost() {
    const content = document.getElementById('postContent').value.trim();
    const mediaFile = document.getElementById('mediaFile').files[0];
    const selectedPlatforms = Array.from(document.querySelectorAll('.platform-select input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    const scheduleType = document.querySelector('input[name="scheduleType"]:checked').value;
    const scheduleTime = document.getElementById('scheduleTime').value;
    
    if (!content) {
        showStatus('Please enter post content!', 'error');
        return;
    }
    
    if (selectedPlatforms.length === 0) {
        showStatus('Please select at least one platform!', 'error');
        return;
    }
    
    if (scheduleType === 'later' && !scheduleTime) {
        showStatus('Please select a schedule time!', 'error');
        return;
    }
    
    const post = {
        id: Date.now(),
        content: content,
        platforms: selectedPlatforms,
        scheduleType: scheduleType,
        scheduleTime: scheduleType === 'later' ? new Date(scheduleTime) : new Date(),
        status: scheduleType === 'now' ? 'posted' : 'scheduled',
        createdAt: new Date()
    };
    
    scheduledPosts.unshift(post);
    localStorage.setItem('scheduledPosts', JSON.stringify(scheduledPosts));
    
    if (scheduleType === 'now') {
        simulatePosting(post);
    }
    
    // Clear form
    document.getElementById('postContent').value = '';
    document.getElementById('mediaFile').value = '';
    document.querySelectorAll('.platform-select input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelector('input[name="scheduleType"][value="now"]').checked = true;
    document.getElementById('datetimePicker').style.display = 'none';
    
    showStatus('Post ' + (scheduleType === 'now' ? 'published' : 'scheduled') + ' successfully!', 'success');
    displayScheduledPosts();
}

function simulatePosting(post) {
    post.platforms.forEach(platform => {
        console.log(`Posting to ${platform}:`, post.content);
        // In a real app, this would call the actual API
    });
}

function displayScheduledPosts() {
    const postsList = document.getElementById('postsList');
    
    if (scheduledPosts.length === 0) {
        postsList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 50px;">No posts yet. Create your first post!</p>';
        return;
    }
    
    postsList.innerHTML = scheduledPosts.map(post => `
        <div class="post-item">
            <h4>${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}</h4>
            <p>Status: <strong>${post.status}</strong></p>
            <p>Schedule: ${new Date(post.scheduleTime).toLocaleString()}</p>
            <div class="post-platforms">
                ${post.platforms.map(platform => `<span class="platform-tag">${platform}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function updateConnectedAccountsDisplay() {
    const accountsDiv = document.getElementById('connectedAccounts');
    
    if (connectedAccounts.length === 0) {
        accountsDiv.innerHTML = '<p>No accounts connected</p>';
        return;
    }
    
    accountsDiv.innerHTML = connectedAccounts.map(account => 
        `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
            <span>✅ ${account}</span>
            <button onclick="disconnectAccount('${account}')" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Disconnect</button>
        </div>`
    ).join('');
}

function disconnectAccount(platform) {
    connectedAccounts = connectedAccounts.filter(acc => acc !== platform);
    localStorage.setItem('connectedAccounts', JSON.stringify(connectedAccounts));
    updateConnectedAccountsDisplay();
    showStatus(`Disconnected from ${platform}`, 'success');
}

function logout() {
    localStorage.clear();
    location.reload();
}

function showStatus(message, type) {
    // Remove existing status
    const existingStatus = document.querySelector('.status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    const status = document.createElement('div');
    status.className = `status ${type}`;
    status.textContent = message;
    
    document.querySelector('.container').insertBefore(status, document.querySelector('.container').firstChild);
    
    setTimeout(() => {
        status.remove();
    }, 3000);
}

// Auto-schedule functionality
function checkScheduledPosts() {
    const now = new Date();
    
    scheduledPosts.forEach(post => {
        if (post.status === 'scheduled' && new Date(post.scheduleTime) <= now) {
            post.status = 'posted';
            simulatePosting(post);
        }
    });
    
    localStorage.setItem('scheduledPosts', JSON.stringify(scheduledPosts));
    displayScheduledPosts();
}

// Check for scheduled posts every minute
setInterval(checkScheduledPosts, 60000);

// Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
