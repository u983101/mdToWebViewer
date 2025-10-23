// Collapsible folder navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all folder headers
    const folderHeaders = document.querySelectorAll('.folder-header');
    
    folderHeaders.forEach(header => {
        header.addEventListener('click', function(e) {
            // Don't trigger if clicking on the link itself
            if (e.target.tagName === 'A') {
                return;
            }
            
            const folderContents = this.nextElementSibling;
            const folderToggle = this.querySelector('.folder-toggle');
            
            if (folderContents && folderContents.classList.contains('folder-contents')) {
                // Toggle the expanded class
                folderContents.classList.toggle('expanded');
                
                // Update the toggle icon
                if (folderContents.classList.contains('expanded')) {
                    folderToggle.textContent = '▼';
                } else {
                    folderToggle.textContent = '▶';
                }
            }
        });
    });
    
    // Auto-expand folders that contain active items
    const activeLinks = document.querySelectorAll('.navigation a.active');
    
    activeLinks.forEach(activeLink => {
        // Find all parent folder contents and expand them
        let currentElement = activeLink;
        
        while (currentElement) {
            if (currentElement.classList && currentElement.classList.contains('folder-contents')) {
                currentElement.classList.add('expanded');
                
                // Update the toggle icon for the parent folder
                const folderHeader = currentElement.previousElementSibling;
                if (folderHeader && folderHeader.classList.contains('folder-header')) {
                    const folderToggle = folderHeader.querySelector('.folder-toggle');
                    if (folderToggle) {
                        folderToggle.textContent = '▼';
                    }
                }
            }
            currentElement = currentElement.parentElement;
        }
    });
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchInput && searchButton) {
        // Search on button click
        searchButton.addEventListener('click', function() {
            performSearch();
        });
        
        // Search on Enter key press
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        function performSearch() {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // Get the base path from the current URL or use empty string
                const currentPath = window.location.pathname;
                let basePath = '';
                
                // Extract base path by finding the common prefix before the markdown files
                if (currentPath.includes('/')) {
                    // Remove any trailing filename and get the directory path
                    const pathParts = currentPath.split('/');
                    // The base path should be everything before the markdown file paths
                    // For example: /app_name/sample-sdlc-project -> /app_name
                    if (pathParts.length > 2) {
                        basePath = '/' + pathParts[1];
                    }
                }
                
                // Use the base path in the search URL
                const searchUrl = `${basePath}/search?q=${encodeURIComponent(searchTerm)}`;
                window.location.href = searchUrl;
            }
        }
    }
});
