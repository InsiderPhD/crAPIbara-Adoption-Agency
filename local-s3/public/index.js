document.addEventListener('DOMContentLoaded', () => {
    // Fetch file data from API endpoint
    fetch('/api/files')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateFileList(data.files);
        })
        .catch(error => {
            console.error('Error fetching files:', error);
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = '<li>Error loading files</li>';
        });
});

// Function to format bytes into human-readable format
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to update the file list
function updateFileList(files) {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    // Create a grid layout for images and list for other files
    const imageFiles = files.filter(file => file.isImage);
    const otherFiles = files.filter(file => !file.isImage);

    // Create image grid
    const imageGrid = document.createElement('div');
    imageGrid.className = 'image-grid';
    imageFiles.forEach(file => {
        const img = document.createElement('div');
        img.className = 'image-item';
        img.innerHTML = `
            <img src="/images/${file.name}" alt="${file.name}">
            <div class="image-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatBytes(file.size)}</span>
                <span class="file-modified">${new Date(file.modified).toLocaleString()}</span>
            </div>
        `;
        imageGrid.appendChild(img);
    });
    fileList.parentNode.insertBefore(imageGrid, fileList);

    // Create list for other files
    otherFiles.forEach(file => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `
            <span class="file-name">
                <a href="/images/${file.name}">${file.name}</a>
            </span>
            <span class="file-size">${formatBytes(file.size)}</span>
            <span class="file-modified">${new Date(file.modified).toLocaleString()}</span>
        `;
        fileList.appendChild(li);
    });
}
