// Time Zone Component JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Time zone functionality
    function updateTimes() {
        const now = new Date();
        
        // Local time
        document.getElementById('localTime').textContent = now.toLocaleTimeString();
        
        // Hong Kong time
        document.getElementById('hkTime').textContent = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Hong_Kong' });
        
        // China time
        document.getElementById('chinaTime').textContent = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Shanghai' });
        
        // India time
        document.getElementById('indiaTime').textContent = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' });
        
        // Poland time
        document.getElementById('polandTime').textContent = now.toLocaleTimeString('en-US', { timeZone: 'Europe/Warsaw' });
    }
    
    // Update times immediately and every second
    updateTimes();
    setInterval(updateTimes, 1000);
    
    // Expand/collapse functionality
    const timeZoneToggle = document.getElementById('timeZoneToggle');
    if (timeZoneToggle) {
        timeZoneToggle.addEventListener('click', function() {
            const expanded = document.getElementById('timeZoneExpanded');
            const expandIcon = this.querySelector('.expand-icon');
            
            if (expanded.classList.contains('expanded')) {
                expanded.classList.remove('expanded');
                expandIcon.textContent = '▼';
            } else {
                expanded.classList.add('expanded');
                expandIcon.textContent = '▲';
            }
        });
    }
});
